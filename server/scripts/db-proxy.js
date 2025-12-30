const { Connector } = require('@google-cloud/cloud-sql-connector');
const net = require('net');
require('dotenv').config();

const runner = async () => {
    const connector = new Connector();

    // Replace with your instance connection name
    const instanceConnectionName = 'track-star-481601:us-central1:track-star-db';

    console.log(`Starting Cloud SQL Proxy for instance: ${instanceConnectionName}`);

    try {
        const opts = await connector.getOptions({
            instanceConnectionName,
            ipType: 'PUBLIC', // Use PUBLIC if you are connecting from outside VPC
        });

        const server = net.createServer((client) => {
            try {
                const stream = opts.stream();
                client.pipe(stream).pipe(client);
            } catch (err) {
                console.error('Error establishing connection:', err);
                client.destroy();
            }
        });

        server.listen(5432, '0.0.0.0', () => {
            console.log('Proxy listening on 0.0.0.0:5432 (All interfaces)');
            console.log('You can now run Prisma commands or connect from Docker.');
        });

        process.on('SIGINT', () => {
            console.log('Shutting down proxy...');
            server.close();
            connector.close();
            process.exit();
        });

    } catch (err) {
        console.error('Failed to start proxy:', err);
        process.exit(1);
    }
};

runner();
