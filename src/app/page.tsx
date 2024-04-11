'use client'
 
import { useState } from 'react';
import { useUIState, useActions } from "ai/rsc";
import type { AI } from './action';
 
export default function Page() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
 
  return (
    <div className='h-4/5 mx-80 p-4 '>
      <div className='w-full'>
        {
        // View messages in UI state
        messages.map((message) => (
          <div key={message.id}>
            {message.display}
          </div>
        ))
      }
      </div>
      
 
      <form onSubmit={async (e) => {
        e.preventDefault();
 
        // Add user message to UI state
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: Date.now(),
            display: <div>{inputValue}</div>,
          },
        ]);
 
        // Submit and get response message
        const responseMessage = await submitUserMessage(inputValue);
        setMessages((currentMessages) => [
          ...currentMessages,
          responseMessage,
        ]);
 
        setInputValue('');
      }}>
        <input
          className='fixed bottom-0 left-1/3 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-md'
          placeholder="Send a message..."
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value)
          }}
        />
      </form>
    </div>
  )
}