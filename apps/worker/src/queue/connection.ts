import type { Channel, Connection } from 'amqplib';
import { connect } from 'amqplib';

import { config } from '../config';

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function getConnection(): Promise<Connection> {
  if (!connection) {
    connection = (await connect(config.RABBITMQ_URL)) as unknown as Connection;
    connection.on('error', (err: Error) => {
      console.error('RabbitMQ connection error:', err);
      connection = null;
      channel = null;
    });
    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });
  }
  return connection;
}

export async function getChannel(): Promise<Channel> {
  if (!channel) {
    const conn = await getConnection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel = (await (conn as any).createChannel()) as Channel;
    
    // Set prefetch for fair dispatch
    await channel.prefetch(parseInt(config.WORKER_CONCURRENCY, 10));
    
    channel.on('error', (err: Error) => {
      console.error('RabbitMQ channel error:', err);
      channel = null;
    });
    channel.on('close', () => {
      console.log('RabbitMQ channel closed');
      channel = null;
    });
  }
  return channel;
}

export async function closeConnection(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (connection as any).close();
    connection = null;
  }
}
