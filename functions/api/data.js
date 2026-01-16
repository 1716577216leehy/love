export async function onRequestPost(context) {
    const { action, user, content, image, id, groupName } = await context.request.json();
    const KV = context.env.LOVE_DATA;

    // --- 1. 思念计数逻辑 ---
    if (action === 'missYou') {
        const missLogs = JSON.parse(await KV.get("miss_logs") || "[]");
        missLogs.push({ from: user, time: Date.now() });
        await KV.put("miss_logs", JSON.stringify(missLogs));
        return new Response(JSON.stringify({ status: "ok" }));
    }

    if (action === 'getMissStats') {
        const missLogs = JSON.parse(await KV.get("miss_logs") || "[]");
        const targetUser = user === "黄泽钰" ? "李鸿运" : "黄泽钰";
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        const logs = missLogs.filter(l => l.from === targetUser);
        return new Response(JSON.stringify({
            today: logs.filter(l => l.time >= startOfDay).length,
            month: logs.filter(l => l.time >= startOfMonth).length,
            year: logs.filter(l => l.time >= startOfYear).length
        }));
    }

    // --- 2. 生日愿望存储 (新功能) ---
    if (action === 'addWish') {
        const wishes = JSON.parse(await KV.get("birthday_wishes") || "[]");
        wishes.push({ id: Date.now(), content: content, time: new Date().toLocaleString() });
        await KV.put("birthday_wishes", JSON.stringify(wishes));
        return new Response(JSON.stringify({ status: "ok" }));
    }
    if (action === 'getWishes') {
        const wishes = await KV.get("birthday_wishes") || "[]";
        return new Response(wishes);
    }
    if (action === 'delWish') {
        let wishes = JSON.parse(await KV.get("birthday_wishes") || "[]");
        wishes = wishes.filter(w => w.id !== id);
        await KV.put("birthday_wishes", JSON.stringify(wishes));
        return new Response(JSON.stringify({ status: "ok" }));
    }

    // --- 3. 心情记录/相册分组等逻辑保持不变 ---
    if (action === 'addMemo') {
        const memos = JSON.parse(await KV.get("memos") || "[]");
        const now = new Date();
        memos.push({ memoId: "memo-" + Date.now(), user, content, time: now.toLocaleString(), rawDate: now.toISOString().split('T')[0] });
        await KV.put("memos", JSON.stringify(memos));
        return new Response(JSON.stringify({ status: "ok" }));
    }
    if (action === 'getMemos') { return new Response(await KV.get("memos") || "[]"); }
    if (action === 'getGroups') { return new Response(await KV.get("album_groups") || '["默认分组"]'); }
    if (action === 'addGroup') {
        let groups = JSON.parse(await KV.get("album_groups") || '["默认分组"]');
        if(!groups.includes(groupName)) groups.push(groupName);
        await KV.put("album_groups", JSON.stringify(groups));
        return new Response(JSON.stringify({ status: "ok" }));
    }
    if (action === 'addPhoto') {
        const photos = JSON.parse(await KV.get("photos") || "[]");
        photos.push({ id: Date.now(), data: image, group: groupName || "默认分组" });
        await KV.put("photos", JSON.stringify(photos));
        return new Response(JSON.stringify({ status: "ok" }));
    }
    if (action === 'getPhotos') { return new Response(await KV.get("photos") || "[]"); }
    if (action === 'delPhoto') {
        let photos = JSON.parse(await KV.get("photos") || "[]");
        photos = photos.filter(p => p.id !== id);
        await KV.put("photos", JSON.stringify(photos));
        return new Response(JSON.stringify({ status: "ok" }));
    }
    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
