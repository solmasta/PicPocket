export default {
  async fetch(request, env, ctx) {
    return new Response("PicPocket Worker", { status: 200 });
  },
};
