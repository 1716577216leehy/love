export async function onRequestPost(context) {
    const { action, user, content, image, id, groupName } = await context.request.json();
    const KV = context.env.LOVE_DATA;

    // --- 分组逻辑 ---
    if (action === 'getGroups') {
        const groups = JSON.parse(await KV.get("album_groups") || '["默认分组"]');
        return new Response(JSON.stringify(groups));
    }
    if (action === 'addGroup') {
        let groups = JSON.parse(await KV.get("album_groups") || '["默认分组"]');
        if(!groups.includes(groupName)) groups.push(groupName);
        await KV.put("album_groups", JSON.stringify(groups));
        return new Response(JSON.stringify({ status: "ok" }));
    }
    if (action === 'delGroup') {
        let groups = JSON.parse(await KV.get("album_groups") || '["默认分组"]');
        groups = groups.filter(g => g !== groupName);
        await KV.put("album_groups", JSON.stringify(groups));
        return new Response(JSON.stringify({ status: "ok" }));
    }

    // --- 心情记录 ---
    if (action === 'addMemo') {
        const memos = JSON.parse(await KV.get("memos") || "[]");
        memos.push({ user, content, time: new Date().toLocaleString() });
        await KV.put("memos", JSON.stringify(memos));
        return new Response(JSON.stringify({ status: "ok" }));
    }
    if (action === 'getMemos') {
        const memos = await KV.get("memos") || "[]";
        return new Response(memos);
    }

    // --- 照片逻辑（带分组标签） ---
    if (action === 'addPhoto') {
        const photos = JSON.parse(await KV.get("photos") || "[]");
        photos.push({ id: Date.now(), data: image, group: groupName });
        await KV.put("photos", JSON.stringify(photos));
        return new Response(JSON.stringify({ status: "ok" }));
    }
    if (action === 'getPhotos') {
        const photos = await KV.get("photos") || "[]";
        return new Response(photos);
    }
    if (action === 'delPhoto') {
        let photos = JSON.parse(await KV.get("photos") || "[]");
        photos = photos.filter(p => p.id !== id);
        await KV.put("photos", JSON.stringify(photos));
        return new Response(JSON.stringify({ status: "ok" }));
    }
}
