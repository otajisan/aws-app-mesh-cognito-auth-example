import axios from 'axios';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

const ApiClient = axios.create({
  baseURL: serverRuntimeConfig.apiUrlBase,
  responseType: 'json',
  headers: {
    'content-type': 'application/json',
  },
});

export default ApiClient;
