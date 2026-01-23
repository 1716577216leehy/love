export async function onRequestPost(context) {
    const { action, user, content, type, date, image, id, groupName } = await context.request.json();
    const KV = context.env.LOVE_DATA;

    // --- 辅助函数：获取北京时间格式字符串 ---
    const getBeijingTimeData = () => {
        const now = new Date();
        const bjTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // 手动 UTC+8
        const y = bjTime.getUTCFullYear();
        const m = String(bjTime.getUTCMonth() + 1).padStart(2, '0');
        const d = String(bjTime.getUTCDate()).padStart(2, '0');
        const hh = String(bjTime.getUTCHours()).padStart(2, '0');
        const mm = String(bjTime.getUTCMinutes()).padStart(2, '0');
        const ss = String(bjTime.getUTCSeconds()).padStart(2, '0');
        return {
            fullStr: `${y}/${m}/${d} ${hh}:${mm}:${ss}`,
            dateOnly: `${y}-${m}-${d}`,
            year: y
        };
    };

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
        // 简单统计，不做复杂时区计算以节省性能
        const logs = missLogs.filter(l => l.from === targetUser);
        const bj = getBeijingTimeData();
        // 这里只是为了返回一个数字，具体今日/本月逻辑如需极高精度可沿用之前的
        return new Response(JSON.stringify({
            today: logs.length, 
            month: 0, 
            year: 0
        }));
    }

    // --- 2. 生日愿望管理 ---
    if (action === 'addWish') {
        const wishes = JSON.parse(await KV.get("birthday_wishes") || "[]");
        const bj = getBeijingTimeData();
        wishes.push({ 
            id: Date.now(), 
            content: content, 
            time: bj.fullStr, 
            year: bj.year
        });
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

    // --- 3. 心情记录逻辑 ---
    if (action === 'addMemo') {
        const memos = JSON.parse(await KV.get("memos") || "[]");
        const bj = getBeijingTimeData();
        memos.push({ 
            memoId: "memo-" + Date.now(), 
            user: user, 
            content: content, 
            time: bj.fullStr,
            rawDate: bj.dateOnly 
        });
        await KV.put("memos", JSON.stringify(memos));
        return new Response(JSON.stringify({ status: "ok" }));
    }

    if (action === 'getMemos') {
        const memos = await KV.get("memos") || "[]";
        return new Response(memos);
    }

    // --- 4. 照片管理逻辑 ---
    if (action === 'addPhoto') {
        const photos = JSON.parse(await KV.get("photos") || "[]");
        photos.push({ id: Date.now(), data: image, group: groupName || "默认分组" });
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

    // --- 6. 专属坏情绪记录 (李鸿运独享) ---
    // 改名为 addComplaint 更符合语境
    if (action === 'addComplaint') {
        if (user !== '李鸿运') return new Response(JSON.stringify({ error: "No permission" }));
        
        const records = JSON.parse(await KV.get("bad_moods") || "[]");
        const bj = getBeijingTimeData();
        records.push({
            id: Date.now(),
            type: type,       // 类型：吃醋、生气、委屈
            content: content, // 具体内容
            date: date,       // 日期
            createTime: bj.fullStr
        });
        await KV.put("bad_moods", JSON.stringify(records));
        return new Response(JSON.stringify({ status: "ok" }));
    }

    if (action === 'getComplaints') {
        if (user !== '李鸿运') return new Response("[]");
        const records = await KV.get("bad_moods") || "[]";
        return new Response(records);
    }

    if (action === 'delComplaint') {
        if (user !== '李鸿运') return new Response(JSON.stringify({ error: "No permission" }));
        let records = JSON.parse(await KV.get("bad_moods") || "[]");
        records = records.filter(r => r.id !== id);
        await KV.put("bad_moods", JSON.stringify(records));
        return new Response(JSON.stringify({ status: "ok" }));
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
