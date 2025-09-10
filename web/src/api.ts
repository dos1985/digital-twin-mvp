import axios from 'axios'
export const api = axios.create({ baseURL: `${location.protocol}//${location.hostname}:8000` })
