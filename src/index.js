export default {
  async fetch(request, env, ctx) {
    return new Response("PicPocket", { status: 200 });
  },
};
