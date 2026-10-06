// API utility for jobs (projects)
import axiosInstance from '../utils/axiosInstance';

const getJobs = async () => {
  const res = await axiosInstance.get('/projects/');
  return Array.isArray(res.data) ? res.data : (res.data.results || []);
};

const jobService = {
  getJobs,
};

export default jobService;
