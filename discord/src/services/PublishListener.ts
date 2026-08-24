import * as http from 'http';
import { PollingService } from './PollingService';

/**
 * A door the site can knock on when it publishes something.
 *
 * The bot polled four feeds every sixty seconds — 5,760 requests a day for an
 * event that happens a handful of times a day, and it still arrived up to a
 * minute late. The site knows the exact moment an article goes out, so it now
 * says so and the poll drops to a slow safety net.
 *
 * Bound to 127.0.0.1 only. The backend runs on the same box, so this never
 * needs to cross the network and no firewall rule has to change for it. The
 * shared secret is the same one the bot already uses to talk to the API — a
 * second secret to lose would be a second secret to lose.
 */
export class PublishListener {
    private server: http.Server | null = null;

    constructor(
        private readonly polling: PollingService,
        private readonly secret: string,
        private readonly port: number,
    ) {}

    public start() {
        if (!this.secret) {
            console.warn('⚠️ [PublishListener] no bot secret — not listening. Polling still covers publishes.');
            return;
        }

        this.server = http.createServer((req, res) => this.handle(req, res));

        this.server.on('error', (error: NodeJS.ErrnoException) => {
            // A port already taken must not take the bot down with it; the
            // poll is still running and nothing is lost but the latency.
            console.error(`❌ [PublishListener] could not listen on ${this.port}:`, error.message);
            this.server = null;
        });

        this.server.listen(this.port, '127.0.0.1', () => {
            console.log(`📨 Publish listener on 127.0.0.1:${this.port}`);
        });
    }

    public stop() {
        this.server?.close();
        this.server = null;
    }

    private handle(req: http.IncomingMessage, res: http.ServerResponse) {
        if (req.method !== 'POST' || req.url !== '/publish') {
            res.writeHead(404).end();
            return;
        }

        if (req.headers['x-discord-bot-token'] !== this.secret) {
            res.writeHead(401).end();
            return;
        }

        let body = '';
        let tooBig = false;

        req.on('data', chunk => {
            body += chunk;
            // Nothing legitimate here is larger than a few kilobytes, and an
            // unbounded read is a way to run the bot out of memory.
            if (body.length > 32_000) {
                tooBig = true;
                res.writeHead(413).end();
                req.destroy();
            }
        });

        req.on('end', async () => {
            if (tooBig) return;

            try {
                const payload = JSON.parse(body);
                const { type, item } = payload;

                if (!type || !item?.id || !item?.title || !item?.slug) {
                    res.writeHead(422).end(JSON.stringify({ message: 'type and item{id,title,slug} required' }));
                    return;
                }

                const posted = await this.polling.announce(String(type), item);

                res.writeHead(posted ? 200 : 502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ posted }));
            } catch (error) {
                console.error('[PublishListener] bad request:', error instanceof Error ? error.message : error);
                res.writeHead(400).end();
            }
        });
    }
}
