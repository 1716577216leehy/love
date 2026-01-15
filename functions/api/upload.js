export async function onRequestPost({ request, env }) {
  try {
    // 1. 从前端请求中获取数据
    const body = await request.json();
    const { image, time } = body;

    if (!image) {
      return new Response("No image data", { status: 400 });
    }

    // 2. 生成唯一的 Key (比如: img_172000000)
    const key = `img_${time}`;

    // 3. 存入 KV 数据库
    // 注意：这里的 'ALBUM_KV' 必须和你 Cloudflare 后台绑定的变量名一模一样
    await env.ALBUM_KV.put(key, image);

    // 4. 返回成功信息
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}