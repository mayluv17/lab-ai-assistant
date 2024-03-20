"use client"
import { useState } from 'react';
import { openai, supabase } from './config';
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions.js';
import { createAndStoreEmbeddings } from './vectorize'


// const form = document.querySelector('form');
// const input = document.querySelector('input');
// const reply = document.querySelector('.reply');

export default function Home() {

  const [userQuery, setUserQuery] = useState<string>("")
  const [chat, setChat] = useState<{ sender: string; message: string | null; }[]>([])

  async function main(input: string) {
    try {
      // reply.innerHTML = "Thinking..."
      const embedding = await createEmbedding(input);
      const match = await findNearestMatch(embedding);
      await getChatCompletion(match, input);
    } catch (error: any) {
       console.error('Error in main function.', error.message);
      //  reply.innerHTML = "Sorry, something went wrong. Please try again.";
    }
  }
  
  // Create an embedding vector representing the query
  async function createEmbedding(input: string) {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input
    });
    return embeddingResponse.data[0].embedding;
  }
  
  // Query Supabase and return a semantically matching text chunk
  async function findNearestMatch(embedding: number[]) {
    const { data } = await supabase.rpc('match_movies', {
      query_embedding: embedding,
      match_threshold: 0.50,
      match_count: 4
    });
    
    // Manage multiple returned matches
    const match = data.map((obj: { content: string; }) => obj.content).join('\n');
    return match;
  }
  
  // Use OpenAI to make the response conversational
  const chatMessages: ChatCompletionMessageParam[] = [{
      role: 'system',
      content: `You are a support assistant expert who loves helping student with information about LAB university. You will be given two pieces of information - some context about school information and a question.
       Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the 
       answer in the context, say, "Sorry, I don't know the answer." Please do not make up the answer.` 
  }];

const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    main(userQuery);
};

async function getChatCompletion(text:string, query:string) {
  chatMessages.push({
    role: 'user',
    content: `Context: ${text} Question: ${query}`,
  });
  
  const { choices } = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: chatMessages,
    temperature: 0.65,
    frequency_penalty: 0.5
  });
  // reply.innerHTML = choices[0].message.content;
  setChat(prevState => [...prevState, {
    sender: 'gpt',
    message: choices[0].message.content}])
}

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
       <h1>
            LabGPT
            <span className="icon material-symbols-outlined">chat_bubble</span>
        </h1>
        <form onSubmit={(e) => handleSubmit}>
            <input type="text" placeholder="How can I help?" onChange={e => setUserQuery(e.target.value)}/>
            <button>
                <span className="icon material-symbols-outlined">send</span>
            </button>
        </form>
        <p className="reply">
          {chat.map(chat => chat.message)}
        </p> 


    </main>
  );
}
