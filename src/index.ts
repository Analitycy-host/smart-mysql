import { createPool, Pool, PoolConfig, escape } from "mysql";

class SmartMysql {

	private poolSize: number;
	private acquireTimeout: number;
	private connectionTimeout: number;
	private masterConfig: PoolConfig = {
		host: "localhost",
		port: 3306,
		user: "root",
		password: "",
		database: "test"
	};
	private slaveConfig?: PoolConfig;
	private masterPool: Pool;
	private slavePool?: Pool;

	public escape = escape;

	constructor(config: Config) {
		config.poolSize ? this.poolSize = config.poolSize : this.poolSize = 25;
		config.acquireTimeout ? this.acquireTimeout = config.acquireTimeout : this.acquireTimeout = 10000;
		config.connectionTimeout ? this.connectionTimeout = config.connectionTimeout : this.connectionTimeout = 5000;
		this.masterConfig = config.master;
		this.masterConfig.connectionLimit = this.poolSize;
		this.masterConfig.connectTimeout = this.connectionTimeout;
		this.masterConfig.acquireTimeout = this.acquireTimeout;
		this.masterPool = createPool(this.masterConfig);
		
		if (config.slave) {
			this.slaveConfig = config.slave;
			this.slaveConfig.connectionLimit = this.poolSize;
			this.slaveConfig.connectTimeout = this.connectionTimeout;
			this.slaveConfig.acquireTimeout = this.acquireTimeout;
			this.slavePool = createPool(this.slaveConfig);
		}

	}

	async queryMaster(sql: string): Promise<any> {
		return new Promise((resolve, reject) => {
			this.masterPool.query(sql, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			})
		});
	};

	async querySlave(sql: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.slavePool) return this.queryMaster(sql);
			this.slavePool.query(sql, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			})
		})
	}
}

type Config = {
	master: ServerConfig,
	slave?: ServerConfig
	poolSize?: number,
	acquireTimeout?: number,
	connectionTimeout?: number
}

type ServerConfig = {
	host: string,
	port?: number,
	user: string,
	password: string,
	database: string
}

export default SmartMysql;