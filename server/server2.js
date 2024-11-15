//From github of MyoungXUE
//this server wont work without the mongodb
//WIP
const Koa = require("koa");
const Router = require("koa-router");
const { bodyParser } = require("@koa/bodyparser");

const app = new Koa();
const router = new Router();

router.get("/", async (ctx) => {
  ctx.body = "Hello Zepp OS";
});

router.post("/sleep", async (ctx) => {
  const body = ctx.request.body;

  // 这里获取数据
  try {
    await run(body);

    ctx.response.body = {
      code: 0,
      message: "SUCCESS",
    };
  } catch (error) {
    console.error(error);
    ctx.response.body = {
      code: -1,
      message: "FAILED",
    };
  }
});

app.use(bodyParser());
app.use(router.routes());

app.listen(4080);
console.log("[demo] server is starting at port 4080");

async function run(params = {}) {
 
}