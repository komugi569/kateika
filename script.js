import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBDik3oWDW7gWakuMv52D9fElACZSGTje0",
    authDomain: "kateika-d687d.firebaseapp.com",
    projectId: "kateika-d687d",
    storageBucket: "kateika-d687d.firebasestorage.app",
    messagingSenderId: "781009725914",
    appId: "1:781009725914:web:6706907fb10f56c51478e3",
    measurementId: "G-HQZVRGD0PZ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const cardNumberInput = document.getElementById('card-number');
    const expiryDateInput = document.getElementById('expiry-date');
    const cvcInput = document.getElementById('cvc');
    const amountInput = document.getElementById('payment-amount');
    const form = document.getElementById('payment-form');
    const submitBtn = document.querySelector('.submit-btn');

    // テストデータ自動入力
    const autoFillBtn = document.getElementById('auto-fill-btn');
    if (autoFillBtn) {
        autoFillBtn.addEventListener('click', () => {
            amountInput.value = '1000000'; 
            document.getElementById('card-name').value = 'TARO YAMADA';
            cardNumberInput.value = '4242 4242 4242 4242';
            expiryDateInput.value = '12/25';
            cvcInput.value = '123';
        });
    }

    // フォームのバリデーション・フォーマット
    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) formattedValue += ' ';
            formattedValue += value[i];
        }
        e.target.value = formattedValue;
    });

    expiryDateInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 3) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });

    cvcInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });

    // 決済処理
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = "処理中...";

        try {
            const dummyStripeToken = "tok_" + Math.random().toString(36).substring(2, 15);
            const cardName = document.getElementById('card-name').value;
            const selectedAmount = Number(amountInput.value);

            await addDoc(collection(db, "payments"), {
                amount: selectedAmount,
                cardName: cardName,
                paymentToken: dummyStripeToken,
                status: "pending", 
                createdAt: new Date()
            });

            // 決済成功後、フォームを隠してシミュレーションを開始
            document.getElementById('form-section').style.display = 'none';
            document.getElementById('simulation-section').style.display = 'block';
            
            startSimulation(selectedAmount);

        } catch (error) {
            console.error("Firebaseへの保存エラー: ", error);
            alert("エラーが発生しました。");
            submitBtn.disabled = false;
            submitBtn.textContent = "決済して運用開始";
        }
    });
});
// ▼▼▼ 変更: リアルタイム株価シミュレーション (8秒上昇→4秒で大暴落) ▼▼▼
function startSimulation(startAmount) {
    const simulationSection = document.getElementById('simulation-section');
    simulationSection.style.display = 'flex';
    simulationSection.classList.add('fullscreen-mode'); 
    
    const ctx = document.getElementById('stockChart').getContext('2d');
    const currentValueDisplay = document.getElementById('current-value-display');
    const chartContainer = document.querySelector('.chart-container');
    
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = '#2a2e3f';

    let currentAmount = startAmount;
    
    // 初期状態は広く「10秒間 (100ステップ)」の枠を表示
    let dataPoints = Array(100).fill(currentAmount);
    let labels = Array(100).fill('');
    labels[0] = '0秒';
    labels[99] = '10秒';
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '評価額 (円)',
                data: dataPoints,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                fill: true,
                tension: 0,
                borderWidth: 3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: { 
                    display: true, 
                    grid: { color: '#2a2e3f' }
                },
                y: {
                    position: 'right',
                    min: startAmount * 0.9, 
                    max: startAmount * 1.1,
                    ticks: {
                        font: { size: 14 },
                        callback: function(value) { return (value / 10000).toLocaleString() + '万円'; }
                    }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    currentValueDisplay.textContent = currentAmount.toLocaleString() + ' 円';

    // 「スタート！」のメッセージ
    const startMessage = document.createElement('div');
    startMessage.innerHTML = 'スタート！';
    startMessage.style.position = 'absolute';
    startMessage.style.top = '50%';
    startMessage.style.left = '50%';
    startMessage.style.transform = 'translate(-50%, -50%)';
    startMessage.style.fontSize = '5rem';
    startMessage.style.fontWeight = 'bold';
    startMessage.style.color = '#ef4444';
    startMessage.style.textShadow = '0 0 30px rgba(239, 68, 68, 0.8)';
    startMessage.style.zIndex = '10';
    startMessage.style.letterSpacing = '5px';
    chartContainer.appendChild(startMessage);

    // 2.5秒間待機してから動き始める
    setTimeout(() => {
        startMessage.style.display = 'none'; 
        chart.options.scales.x.display = false; 

        let step = 0;
        const updateInterval = 100; // 0.1秒ごと
        const totalSteps = 120;     // 12秒間で終了 (8秒上昇 + 4秒暴落)

        const interval = setInterval(() => {
            step++;
            let targetBase = startAmount;
            let volatility = 0.05;

            // 📈 新しいチャート構成（8秒上昇 → 4秒暴落）
            if (step <= 80) {
                // 第1フェーズ: 0〜8秒 (イケイケドンドンで上がり続ける)
                const p = step / 80;
                // 最大5倍まで指数関数的に急騰させる
                targetBase = startAmount * (1 + 4 * Math.pow(p, 3)); 
                volatility = 0.05 + (0.05 * p); // ボラティリティも少しずつ上がる
            } else {
                // 第2フェーズ: 8〜12秒 (最後の4秒でガクッと落ちる)
                const p = (step - 80) / 40;
                // 5倍の頂点から一気に0.2倍(-80%)まで垂直落下
                targetBase = startAmount * (5 - 4.8 * p); 
                volatility = 0.2; // パニック売りで乱高下激しめ
            }
            
            const noise = (Math.random() - 0.5) * (targetBase * volatility); 
            currentAmount = targetBase + noise;
            
            // 最後のステップはきっちり-80%に着地
            if (step === totalSteps) {
                currentAmount = startAmount * 0.2; 
            }

            // ズームインの演出
            if (dataPoints.length > 40) {
                dataPoints.shift(); 
                labels.shift();
            }
            // スクロール処理
            dataPoints.shift();
            labels.shift();

            // 新しいデータを追加
            dataPoints.push(currentAmount);
            labels.push('');

            // Y軸の自動追従（ズーム）
            const visibleMin = Math.min(...dataPoints);
            const visibleMax = Math.max(...dataPoints);
            const padding = (visibleMax - visibleMin) * 0.1 + (startAmount * 0.05);
            chart.options.scales.y.min = Math.max(0, visibleMin - padding); 
            chart.options.scales.y.max = visibleMax + padding;

            chart.update();
            currentValueDisplay.textContent = Math.floor(currentAmount).toLocaleString() + ' 円';

            // 12秒経過で終了・結果表示
            if (step >= totalSteps) {
                clearInterval(interval);
                showResult(startAmount, currentAmount);
            }
        }, updateInterval);
    }, 2500); // 2.5秒後にスタート
}

// ▼▼▼ 復活させた結果表示関数 (絶対に消さないでください！) ▼▼▼
function showResult(start, end) {
    const resultDiv = document.getElementById('simulation-result');
    const detail = document.getElementById('result-detail');
    
    resultDiv.classList.add('fullscreen-result');
    
    const loss = start - end;
    const lossPercent = Math.floor((loss / start) * 100);
    
    resultDiv.style.display = 'block';
    detail.innerHTML = `
        初期投資額: <span style="color:#ffffff;">${start.toLocaleString()} 円</span><br>
        最終評価額: <span style="color:#ffffff;">${end.toLocaleString()} 円</span><br>
        <hr style="border-color: #ef4444; margin: 15px 0;">
        <span style="font-size:1rem; color:#94a3b8;">運用損益</span><br>
        <span style="color:#ef4444; font-weight:bold; font-size:2.5rem;">-${loss.toLocaleString()} 円</span><br>
        <span style="color:#ef4444; font-size:1.5rem;">(マイナス ${lossPercent} %)</span><br>
        <p style="font-size:0.9rem; color:#64748b; margin-top:20px;">※相場は自己責任です。</p>
    `;
}
// ▲▲▲ ここまで ▲▲