import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import config from "../config";
import createHttpError from "http-errors";
import { Document } from "@langchain/core/documents";
import { extractPdfText } from "../helper/extractPdfText";

const getEmbeddings = async () => {
  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    dimensions: 1536,
  });
};

const COLLECTION_NAME = "AI-expense-collection";

export const initVectorStore = async () => {
  const embeddings = await getEmbeddings();
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: config.QDRANT_URL,
      collectionName: COLLECTION_NAME,
    },
  );
  return vectorStore;
};

export const getRetriever = async () => {
  const vectorStore = await initVectorStore();
  const retriever = vectorStore.asRetriever({
    k: 4,
  });
  return retriever;
};


export async function indexPDF({
  pdfBuffer,
  documentId,
  userId,
  fileName,
}: {
  pdfBuffer: Buffer;
  documentId: string;
  userId: string;
  fileName: string;
}) {
  const vectorStore = await initVectorStore();

  const rawText = await extractPdfText(pdfBuffer);

  const docs = [
    new Document({
      pageContent: rawText,
      metadata: {
        documentId,
        userId,
        fileName,
      },
    }),
  ];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  const docsWithMetadata = splitDocs.map((doc:any, index:number) => {
    return new Document({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        chunkIndex: index,
      },
    });
  });

  await vectorStore.addDocuments(docsWithMetadata);

  return {
    msg: "success",
    vector: true,
    chunks: docsWithMetadata.length,
  };
}
