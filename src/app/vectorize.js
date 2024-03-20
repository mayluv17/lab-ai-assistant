import { openai, supabase } from './config.js';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

async function splitDocument(document) {
  const response = await fetch(document);
  const text = await response.text();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 250,
    chunkOverlap: 35,
  });
  const output = await splitter.createDocuments([text]);
  return output;
}

/* Create an embedding from each text chunk.
Store all embeddings and corresponding text in Supabase. */
export async function createAndStoreEmbeddings() {
  const chunkData = await splitDocument("admissions.txt");
  const data = await Promise.all(
    chunkData.map(async (chunk) => {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: chunk.pageContent
      });
      return { 
        content: chunk.pageContent, 
        embedding: embeddingResponse.data[0].embedding 
      }
    })
  );
  await supabase.from('_LabGPT').insert(data);
  console.log('SUCCESS!');
}
createAndStoreEmbeddings();