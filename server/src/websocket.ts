import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer;

export const initWebSocket = (server: Server) => {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected');
        
        // Handle incoming messages from clients
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('Received message:', message);
                // You can add message handling logic here based on message type
            } catch (error) {
                console.error('Invalid message format:', error);
                ws.send(JSON.stringify({ error: 'Invalid message format' }));
            }
        });

        // Handle connection errors
        ws.on('error', (error) => {
            console.error('WebSocket client error:', error);
        });

        ws.on('close', () => console.log('Client disconnected'));

        // Send welcome message to newly connected client
        ws.send(JSON.stringify({ 
            type: 'connection', 
            message: 'Connected to project management server' 
        }));
    });
};

// This function will broadcast a message to all connected clients
export const broadcast = (message: object) => {
    if (!wss) {
        console.error("WebSocket server not initialized.");
        return;
    }

    const data = JSON.stringify(message);
    let sentCount = 0;
    let failedCount = 0;

    console.log(`Broadcasting message: ${data}`);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(data);
                sentCount++;
            } catch (error) {
                console.error('Error sending message to client:', error);
                failedCount++;
            }
        }
    });

    console.log(`Broadcast sent to ${sentCount} clients, ${failedCount} failed`);
};

// Graceful shutdown function
export const closeWebSocket = () => {
    if (wss) {
        console.log('Closing WebSocket server...');
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        });
        wss.close();
    }
};

// Send message to specific client by checking a condition
export const sendToClient = (message: object, filterFn: (ws: WebSocket) => boolean) => {
    if (!wss) {
        console.error("WebSocket server not initialized.");
        return;
    }

    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && filterFn(client)) {
            try {
                client.send(data);
            } catch (error) {
                console.error('Error sending message to specific client:', error);
            }
        }
    });
};