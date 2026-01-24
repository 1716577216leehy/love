export async function onRequestPost(context) {
    const { action, user, content, amount, category, desc, type, date, image, id, groupName } = await context.request.json();
    const KV = context.env.LOVE_DATA;

    // --- 辅助函数：获取北京时间对象 (用于显示) ---
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

    // --- 1. 思念计数 (已修复：精准统计北京时间“今天”的次数) ---
    if (action === 'missYou') {
        const missLogs = JSON.parse(await KV.get("miss_logs") || "[]");
        missLogs.push({ from: user, time: Date.now() });
        await KV.put("miss_logs", JSON.stringify(missLogs));
        return new Response(JSON.stringify({ status: "ok" }));
    }

    if (action === 'getMissStats') {
        const missLogs = JSON.parse(await KV.get("miss_logs") || "[]");
        const targetUser = user === "黄泽钰" ? "李鸿运" : "黄泽钰";
        const logs = missLogs.filter(l => l.from === targetUser);

        // --- 核心修复逻辑开始 ---
        const now = new Date();
        const offset = 8 * 60 * 60 * 1000; // 8小时毫秒数
        // 1. 算出当前是北京时间几号
        const bjTime = new Date(now.getTime() + offset);
        // 2. 构造由于时区差异导致的“北京时间今天0点”对应的 UTC 时间戳
        // 例如：北京 24日 00:00 = UTC 23日 16:00
        const bjMidnightUtc = Date.UTC(bjTime.getUTCFullYear(), bjTime.getUTCMonth(), bjTime.getUTCDate());
        const startOfDay = bjMidnightUtc - offset; 
        
        const todayCount = logs.filter(l => l.time >= startOfDay).length;
        // --- 核心修复逻辑结束 ---

        return new Response(JSON.stringify({
            today: todayCount, // 现在返回的是精准的今日次数
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
            year: bj.year,
            status: 0 
        });
        await KV.put("birthday_wishes", JSON.stringify(wishes));
        return new Response(JSON.stringify({ status: "ok" }));
    }

    if (action === 'getWishes') {
        const wishes = await KV.get("birthday_wishes") || "[]";
        return new Response(wishes);
    }

    if (action === 'toggleWish') {
        let wishes = JSON.parse(await KV.get("birthday_wishes") || "[]");
        wishes = wishes.map(w => {
            if (w.id === id) return { ...w, status: w.status === 1 ? 0 : 1 };
            return w;
        });
        await KV.put("birthday_wishes", JSON.stringify(wishes));
        return new Response(JSON.stringify({ status: "ok" }));
    }

    if (action === 'delWish') {
        let wishes = JSON.parse(await KV.get("birthday_wishes") || "[]");
        wishes = wishes.filter(w => w.id !== id);
        await KV.put("birthday_wishes", JSON.stringify(wishes));
        return new Response(JSON.stringify({ status: "ok" }));
    }

    // --- 3. 坏情绪小本本 ---
    if (action === 'addComplaint') {
        if (user !== '李鸿运') return new Response(JSON.stringify({ error: "No permission" }));
        const records = JSON.parse(await KV.get("bad_moods") || "[]");
        const bj = getBeijingTimeData();
        records.push({ id: Date.now(), type: type || '心情', content: content, date: date, createTime: bj.fullStr });
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

    // --- 4. 基础功能 ---
    if (action === 'addMemo') {
        const memos = JSON.parse(await KV.get("memos") || "[]");
        const bj = getBeijingTimeData();
        memos.push({ memoId: "memo-" + Date.now(), user, content, time: bj.fullStr, rawDate: bj.dateOnly });
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
