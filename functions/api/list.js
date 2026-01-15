export async function onRequestGet({ env }) {
  try {
    // 1. 列出 KV 里的所有 Key
    const list = await env.ALBUM_KV.list();
    
    const images = [];
    
    // 2. 遍历 Key，把内容取出来
    // (注意：KV读取如果太多会慢，这里适合照片量不是特别大的情况)
    for (const key of list.keys) {
      const val = await env.ALBUM_KV.get(key.name);
      if (val) images.push(val);
    }

    // 3. 返回数组给前端
    return new Response(JSON.stringify(images), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}