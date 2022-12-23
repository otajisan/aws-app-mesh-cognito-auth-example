import { NextApiRequest, NextApiResponse } from 'next';

const HealthCheckHandler = (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({ status: 'UP' });
};

export default HealthCheckHandler;
