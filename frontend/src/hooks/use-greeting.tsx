import { useEffect, useState } from 'react';
import axios from 'axios';
import { GreetingMessageResponse } from '../types/greeting-message-response';

const useGreeting = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [greetingMessage, setGreetingMessage] = useState<GreetingMessageResponse | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);

    const f = async () => await fetchGreetingMessage();
    f()
      .then((r) => {
        if (r === null || typeof r === 'undefined') {
          return;
        }
        setGreetingMessage(r);
        setIsSuccess(true);
      })
      .catch((e) => {
        setIsError(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return {
    isLoading,
    isSuccess,
    isError,
    greetingMessage,
  };
};

const fetchGreetingMessage: () => Promise<GreetingMessageResponse | null> = async () =>
  await axios
    .get(`api/greeting/to/`)
    .then((response) => {
      return response.data as GreetingMessageResponse;
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

export default useGreeting;
