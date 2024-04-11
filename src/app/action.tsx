import { OpenAI } from 'openai';
import { createAI, getMutableAIState, render } from 'ai/rsc';
import { z } from 'zod';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { FlightCard } from '../components/flight-card';
import { WeatherCard } from '../components/weather-card';

let isProxy = process.env.NODE_ENV === 'development';
const agent: any = isProxy ? new HttpsProxyAgent('http://127.0.0.1:1087') : null;

const mapLocation = (location: string) => {
  const map = {
    '北京市': '110000',
    '天津市': '120000',
    '上海市': '310000',
    '重庆市': '500000',
    '杨浦区': '310110',
    '黄浦区': '310101',
    '虹口区': '310109',
    '长宁区': '310105',
    '静安区': '310106',
    '普陀区': '310107',
    '闸北区': '310108',
    '宝山区': '310113',
    '闵行区': '310112',
    '嘉定区': '310114',
    '浦东新区': '310115',
    '松江区': '310117',
    '金山区': '310116',
    '青浦区': '310118',
    '奉贤区': '310120',
    '崇明区': '310151',
    '徐汇区': '310104',
    '南汇区': '310119',
    '卢湾区': '310103',
  }

  const name = Object.keys(map).find(key => key.includes(location));

  return name && map[name]
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: agent,
});

// An example of a spinner component. You can also import your own components,
function Spinner() {
  return (
    <div className='flex justify-center items-center'>
      <div className='grid min-h-[140px] w-full place-items-center overflow-x-scroll rounded-lg p-6 lg:overflow-visible'>
        <svg
          className='text-gray-300 animate-spin'
          viewBox='0 0 64 64'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
        >
          <path
            d='M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z'
            stroke='currentColor'
            strokeWidth='5'
            strokeLinecap='round'
            strokeLinejoin='round'
          ></path>
          <path
            d='M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762'
            stroke='currentColor'
            strokeWidth='5'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-gray-900'
          ></path>
        </svg>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// An example of a function that fetches flight information from an external API.
async function getFlightInfo(flightNumber: string) {
  await delay(2000);
  return {
    flightNumber,
    company: 'China Airlines',
    departure: 'Shanghai',
    arrival: 'Beijing',
    departs: '2022-12-01T12:00:00Z',
    arrives: '2022-12-01T15:00:00Z',
    duration: '3 hours',
    gate: 'A1',
  };
}

async function getWeatherInfo(location: string) {
  console.log(location, 'location-----------------------');
  const locationCode = mapLocation(location);
  if (!locationCode) throw new Error('Location not found');
  return await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?city=${location}&key=${process.env.GAODE_API_KEY}`)
}

async function submitUserMessage(userInput: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  // Update the AI state with the new user message.
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: userInput,
    },
  ]);

  // The `render()` creates a generated, streamable UI.
  const ui = render({
    model: 'gpt-4-0125-preview',
    provider: openai,
    messages: [{ role: 'system', content: 
    'You are a personal AI assistant, dedicated to provide information for this particular user. The user may ask about his flight information, or any other thins. If the user asks about his flight information, use tool `get_flight_info` to get it. If the user asks about weather, you should use tool `get_weather_info` to get it. Besides that, you can also chat with users and do some calculations if needed.' 
  }, ...aiState.get()],
    // `text` is called when an AI returns a text response (as opposed to a tool call).
    // Its content is streamed from the LLM, so this function will be called
    // multiple times with `content` being incremental.
    text: ({ content, done }) => {
      // When it's the final content, mark the state as done and ready for the client to access.
      if (done) {
        aiState.done([
          ...aiState.get(),
          {
            role: 'assistant',
            content,
          },
        ]);
      }

      return <p>{content}</p>;
    },
    tools: {
      get_flight_info: {
        description: 'Get the information for a flight',
        parameters: z
          .object({
            flightNumber: z.string().describe('the number of the flight. E.g. CA1234/MU5745/MU588'),
          })
          .required(),
        render: async function* ({ flightNumber }) {
          // Show a spinner on the client while we wait for the response.
          yield <Spinner />;

          // Fetch the flight information from an external API.
          const flightInfo = await getFlightInfo(flightNumber);

          // Update the final AI state.
          aiState.done([
            ...aiState.get(),
            {
              role: 'function',
              name: 'get_flight_info',
              // Content can be any string to provide context to the LLM in the rest of the conversation.
              content: JSON.stringify(flightInfo),
            },
          ]);

          // Return the flight card to the client.
          return <FlightCard flightInfo={flightInfo} />;
        },
      },
      get_weather_info: {
        description: 'Get the weather information for a location',
        parameters: z
          .object({
            location: z.string().describe('the location to get the weather of in Chinese.'),
          })
          .required(),
        render: async function* ({ location }) {
          yield <Spinner />;
          const res = await getWeatherInfo(location);
          const weatherInfo = await res.json();
          console.log(weatherInfo.lives[0], 'weatherInfo-------------------');
          aiState.done([
            ...aiState.get(),
            {
              role: 'function',
              name: 'get_weather_info',
              content: JSON.stringify(weatherInfo.lives[0]),
            },
          ]);
          return <WeatherCard weatherInfo={weatherInfo.lives[0]} />;
        }
      }
    },
  });

  return {
    id: Date.now(),
    display: ui,
  };
}

// Define the initial state of the AI. It can be any JSON object.
const initialAIState: {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  id?: string;
  name?: string;
}[] = [];

// The initial UI state that the client will keep track of, which contains the message IDs and their UI nodes.
const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI({
  actions: {
    submitUserMessage,
  },
  // Each state can be any shape of object, but for chat applications
  // it makes sense to have an array of messages. Or you may prefer something like { id: number, messages: Message[] }
  initialUIState,
  initialAIState,
});
