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

// ▼▼▼ 追加: リアルタイム株価シミュレーションのロジック ▼▼▼
function startSimulation(startAmount) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    const currentValueDisplay = document.getElementById('current-value-display');
    
    // ダークテーマ用のChart.js設定
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = '#2a2e3f';

    let currentAmount = startAmount;
    let labels = ['0秒'];
    let dataPoints = [currentAmount];
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '評価額 (円)',
                data: dataPoints,
                borderColor: '#ef4444', // 暴落を連想させる赤
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 0 // 点を消して滑らかな線に
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 400,
                easing: 'linear'
            },
            scales: {
                y: {
                    min: startAmount * 0.3,
                    max: startAmount * 1.1,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + '円';
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    currentValueDisplay.textContent = currentAmount.toLocaleString() + ' 円';

    let step = 0;
    const totalSteps = 20; // 0.5秒 × 20回 = 10秒

    const interval = setInterval(() => {
        step++;
        labels.push((step * 0.5) + '秒');
        
        // 最終的に -50% に向かうようにベースラインを下げる
        const progress = step / totalSteps; 
        const targetBase = startAmount - (startAmount * 0.5 * progress); 
        
        // ランダムな上下のブレ（ノイズ）を作ってリアル感を出す
        const noise = (Math.random() - 0.5) * (startAmount * 0.1); 
        
        currentAmount = targetBase + noise;
        
        // 最後のステップはきっちり半額(-50%)に調整
        if(step === totalSteps) {
            currentAmount = startAmount * 0.5;
        }

        dataPoints.push(currentAmount);
        chart.update();

        // 画面上の数字も更新
        currentValueDisplay.textContent = Math.floor(currentAmount).toLocaleString() + ' 円';

        // 10秒経過（20ステップ）で終了
        if (step >= totalSteps) {
            clearInterval(interval);
            showResult(startAmount, currentAmount);
        }
    }, 500); // 0.5秒ごとに更新
}

function showResult(start, end) {
    const resultDiv = document.getElementById('simulation-result');
    const detail = document.getElementById('result-detail');
    
    const loss = start - end;
    
    resultDiv.style.display = 'block';
    detail.innerHTML = `
        初期投資額: <strong>${start.toLocaleString()} 円</strong><br>
        最終評価額: <strong>${end.toLocaleString()} 円</strong><br>
        <hr style="border-color: #ef4444; margin: 10px 0;">
        収支報告: <span style="color:#ef4444; font-weight:bold; font-size:1.3rem;">-${loss.toLocaleString()} 円 (-50%)</span><br>
        <span style="font-size:0.85rem; color:#fca5a5;">※投資にはリスクが伴います。</span>
    `;
}