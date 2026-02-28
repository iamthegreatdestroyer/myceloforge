import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
const qdrantApiKey = process.env.QDRANT_API_KEY;

const qdrantClient = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey,
});

export const EMPIRES_COLLECTION = "empires";

export async function initializeQdrant() {
  try {
    // Check if collection exists, create if not
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (c) => c.name === EMPIRES_COLLECTION
    );

    if (!collectionExists) {
      await qdrantClient.createCollection(EMPIRES_COLLECTION, {
        vectors: {
          size: 384, // For sentence-transformers embeddings
          distance: "Cosine",
        },
      });
      console.log(`Created Qdrant collection: ${EMPIRES_COLLECTION}`);
    }
  } catch (error) {
    console.error("Failed to initialize Qdrant:", error);
  }
}

export async function searchSimilarEmpires(
  embedding: number[],
  limit: number = 5
) {
  try {
    const results = await qdrantClient.search(EMPIRES_COLLECTION, {
      vector: embedding,
      limit,
    });
    return results;
  } catch (error) {
    console.error("Error searching similar empires:", error);
    return [];
  }
}

export async function upsertEmpireEmbedding(
  empireId: string,
  embedding: number[],
  payload: Record<string, unknown>
) {
  try {
    await qdrantClient.upsert(EMPIRES_COLLECTION, {
      points: [
        {
          id: parseInt(empireId.replace(/\D/g, "")) || Math.random() * 1000000,
          vector: embedding,
          payload,
        },
      ],
    });
  } catch (error) {
    console.error("Error upserting empire embedding:", error);
  }
}

export default qdrantClient;
