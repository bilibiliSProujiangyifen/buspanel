const apiUrls = [
    'https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/437D60C455A624E6', 
    'https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/537168ECCA2CE578', 
    'https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/9E3D2E34F849E298', 
    'https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/8EFA13840D1272E8', 
    // 更多API URLs
];

async function fetchMultipleApis() {
    try {
        const responses = await Promise.all(apiUrls.map(url => fetch(url)));
        const results = await Promise.all(responses.map(res => res.json()));

        let combinedResults = []; // Combine all results into one array
        results.forEach(result => {
            const currTime = new Date(result.generated_timestamp);
            const etaByRoute = result.data.reduce((acc, trainData) => {
                const key = trainData.route;
                if (!acc[key] || trainData.eta) {
                    acc[key] = trainData;
                }
                return acc;
            }, {});

            Object.values(etaByRoute).forEach(trainData => {
                let eta = trainData.eta ? getTimeDiff(currTime, trainData.eta) : trainData.rmk_tc;
                combinedResults.push({
                    route: trainData.route,
                    dest_tc: trainData.dest_tc,
                    eta: eta
                });
            });
        });

        let resultString = `<div class="time-box">瀝源邨 ${new Date().toLocaleString("zh-TH", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>`;
        combinedResults.forEach(trainData => {
            resultString += `
                <div class="white-box">
                    <div class="route">${trainData.route}</div>
                    <div class="co">${trainData.dest_tc}</div>
                    <div class="minute">${trainData.eta}</div>
                </div>`;
        });

        // 清空message-wrapper容器的内容
        const messageWrapper = document.getElementById('message-wrapper');
        messageWrapper.innerHTML = ''; // 清空内容
        messageWrapper.innerHTML = resultString; // 添加新的预报信息
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function getTimeDiff(curr, target) {
    if (!target) {
        return "N/A";
    }

    const currTimestamp = new Date(curr).getTime();
    const targetTimestamp = new Date(target).getTime();
    const timeLeft = Math.ceil((targetTimestamp - currTimestamp) / 1000);
    
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    if (minutes === 0 && seconds === 0) {
        return "即將到達";
    } else if (timeLeft <= 0) {
        return "可能已經走咗";
    } else {
        return `${minutes}<span class="unit">分鐘</span> ${seconds}<span class="unit">秒</span>`;
    }
}

// 确保DOM加载完成后执行函数，并设置定时器每30秒刷新一次
document.addEventListener('DOMContentLoaded', function() {
    fetchMultipleApis();
    setInterval(fetchMultipleApis, 30000);
});