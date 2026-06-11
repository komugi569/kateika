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
// ▼▼▼ 変更: リアルタイム株価シミュレーション (バブル崩壊モデル) ▼▼▼
function startSimulation(startAmount) {
    const simulationSection = document.getElementById('simulation-section');
    simulationSection.style.display = 'flex';
    simulationSection.classList.add('fullscreen-mode'); // 全画面クラスを付与
    
    const ctx = document.getElementById('stockChart').getContext('2d');
    const currentValueDisplay = document.getElementById('current-value-display');
    
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = '#2a2e3f';

    let currentAmount = startAmount;
    const windowSize = 40; // 画面に表示するデータポイント数（少し広げて流れを見やすく）
    let labels = Array(windowSize).fill('');
    let dataPoints = Array(windowSize).fill(currentAmount);
    
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
                tension: 0, // かくかく
                borderWidth: 3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 全画面に引き伸ばすために必須
            animation: false,
            scales: {
                x: { display: false },
                y: {
                    position: 'right', // 金額を右側に表示
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

    let step = 0;
    const updateInterval = 100; // 0.1秒ごと
    const totalSteps = 120;     // 12秒間で終了 (絶望を長く味わわせる)

    const interval = setInterval(() => {
        step++;
        const progress = step / totalSteps; 
        let targetBase = startAmount;
        let volatility = 0.05; // ノイズの大きさ

        // 📈 バブル経済モデルの計算
        if (progress < 0.35) {
            // 第1フェーズ: 狂乱のバブル形成 (0〜4.2秒) -> 資産が約4倍に急騰
            const p = progress / 0.35;
            targetBase = startAmount * (1 + 3 * Math.pow(p, 3)); 
            volatility = 0.08; // イケイケなのでボラティリティ高め
        } else if (progress < 0.5) {
            // 第2フェーズ: バブル崩壊・パニック売り (4.2〜6秒) -> 一気に暴落
            const p = (progress - 0.35) / 0.15;
            // 4倍の頂点から0.6倍まで垂直落下
            targetBase = startAmount * (4 - 3.4 * p); 
            volatility = 0.15; // パニック相場で乱高下
        } else {
            // 第3フェーズ: 失われた30年 (6〜12秒) -> ジリ貧で下がり続ける
            const p = (progress - 0.5) / 0.5;
            // 0.6倍から0.2倍(-80%)までゆっくり削られる
            targetBase = startAmount * (0.6 - 0.4 * p); 
            volatility = 0.03; // 出来高が減ってジリジリ下がる
        }
        
        // ランダムな上下のブレ
        const noise = (Math.random() - 0.5) * (targetBase * volatility); 
        currentAmount = targetBase + noise;
        
        // 最終着地はきっちり-80%の悲惨な数字に
        if(step === totalSteps) {
            currentAmount = startAmount * 0.2; 
        }

        labels.push('');
        labels.shift();
        dataPoints.push(currentAmount);
        dataPoints.shift();

        // ズーム追従
        const visibleMin = Math.min(...dataPoints);
        const visibleMax = Math.max(...dataPoints);
        const padding = (visibleMax - visibleMin) * 0.1 + (startAmount * 0.05);
        chart.options.scales.y.min = Math.max(0, visibleMin - padding); // 0円以下にはならないように
        chart.options.scales.y.max = visibleMax + padding;

        chart.update();
        currentValueDisplay.textContent = Math.floor(currentAmount).toLocaleString() + ' 円';

        if (step >= totalSteps) {
            clearInterval(interval);
            showResult(startAmount, currentAmount);
        }
    }, updateInterval);
}

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