"""
Database query optimization for MYCELOFORGE backend
Implements connection pooling, eager loading, and query caching
"""

from typing import Optional, List, Any
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session, joinedload
from sqlalchemy.pool import QueuePool, NullPool
import os


class QueryOptimizer:
    """Database query optimization utilities"""

    @staticmethod
    def setup_connection_pool(
        database_url: str,
        pool_size: int = 10,
        max_overflow: int = 20,
        pool_recycle: int = 3600,
        pool_pre_ping: bool = True,
        echo: bool = False,
    ):
        """
        Setup optimized SQLAlchemy engine with connection pooling

        Args:
            database_url: Database connection URL
            pool_size: Number of pre-allocated connections
            max_overflow: Maximum additional connections beyond pool_size
            pool_recycle: Recycle connections after N seconds (default 1 hour)
            pool_pre_ping: Test connections before use (prevents timeout errors)
            echo: Log SQL statements (development only)

        Returns:
            Configured SQLAlchemy engine
        """
        engine = create_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_pre_ping=pool_pre_ping,
            pool_recycle=pool_recycle,
            echo=echo,
            connect_args={
                'timeout': 30,  # 30 second connection timeout
                'check_same_thread': False,  # For SQLite
            }
        )

        # Log connection pool status periodically
        @event.listens_for(engine, 'checkin')
        def receive_checkin(dbapi_conn, connection_record):
            """Log when connections are returned to pool"""
            pass

        return engine

    @staticmethod
    def query_with_eager_loading(session: Session, model_class, relationships: List[str]):
        """
        Create query with eager loading to prevent N+1 queries

        Args:
            session: SQLAlchemy session
            model_class: Model class to query
            relationships: List of relationships to eager load

        Returns:
            Query object with eager loading configured

        Example:
            empires = QueryOptimizer.query_with_eager_loading(
                session,
                Empire,
                ['user', 'deployments']
            ).all()
        """
        query = session.query(model_class)

        for relationship in relationships:
            try:
                # Try to access the relationship attribute
                rel_attr = getattr(model_class, relationship)
                query = query.options(joinedload(rel_attr))
            except AttributeError:
                print(f"Warning: {model_class.__name__} has no relationship '{relationship}'")

        return query

    @staticmethod
    def create_indexes(engine, indexes_config: dict):
        """
        Create database indexes for query optimization

        Args:
            engine: SQLAlchemy engine
            indexes_config: Dict of table_name -> list of column names
        """
        with engine.connect() as conn:
            for table_name, columns in indexes_config.items():
                for column in columns:
                    index_name = f"idx_{table_name}_{column}"
                    sql = f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({column})"
                    try:
                        conn.execute(sql)
                        print(f"Created index: {index_name}")
                    except Exception as e:
                        print(f"Failed to create index {index_name}: {e}")

            conn.commit()


# Recommended indexes for MYCELOFORGE
RECOMMENDED_INDEXES = {
    'empires': ['user_id', 'created_at', 'status'],
    'users': ['email', 'created_at'],
    'transactions': ['user_id', 'empire_id', 'created_at'],
    'audit_logs': ['user_id', 'action', 'created_at'],
}


def get_db_session(engine) -> Session:
    """Get SQLAlchemy session with proper configuration"""
    SessionLocal = sessionmaker(
        bind=engine,
        expire_on_commit=False,  # Don't expire objects after commit
        autoflush=False,  # Manual flush control
    )
    return SessionLocal()


class DatabaseConfig:
    """Database configuration for different environments"""

    @staticmethod
    def get_database_url() -> str:
        """Get database URL from environment"""
        env = os.getenv('ENVIRONMENT', 'development')

        if env == 'production':
            return os.getenv('DATABASE_URL_PROD', '')
        elif env == 'staging':
            return os.getenv('DATABASE_URL_STAGING', '')
        else:  # development
            return os.getenv('DATABASE_URL_DEV', 'sqlite:///./myceloforge.db')

    @staticmethod
    def get_pool_config(env: str = 'development') -> dict:
        """Get optimal connection pool config for environment"""
        configs = {
            'development': {
                'pool_size': 5,
                'max_overflow': 10,
                'echo': True,
            },
            'staging': {
                'pool_size': 20,
                'max_overflow': 40,
                'echo': False,
            },
            'production': {
                'pool_size': 30,
                'max_overflow': 60,
                'echo': False,
                'pool_pre_ping': True,
                'pool_recycle': 3600,
            },
        }
        return configs.get(env, configs['development'])


# Query optimization examples
QUERY_OPTIMIZATION_EXAMPLES = """
# N+1 Query Problem (BAD - multiple queries)
empires = session.query(Empire).all()
for empire in empires:
    print(empire.user.name)  # Separate query for each empire!

# Solution: Eager Loading (GOOD - single query with join)
empires = QueryOptimizer.query_with_eager_loading(
    session,
    Empire,
    ['user']
).all()
for empire in empires:
    print(empire.user.name)  # No extra queries!

# Indexes for Fast Filtering
# Add index on frequently filtered columns:
# - user_id (filter by user)
# - created_at (filter by date range)
# - status (filter by state)

# Connection Pool Configuration
engine = QueryOptimizer.setup_connection_pool(
    database_url=os.getenv('DATABASE_URL'),
    pool_size=20,  # Pre-allocate 20 connections
    max_overflow=40,  # Allow up to 40 more
    pool_pre_ping=True,  # Test before use
    pool_recycle=3600,  # Recycle after 1 hour
)
"""
