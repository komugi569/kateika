// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDik3oWDW7gWakuMv52D9fElACZSGTje0",
  authDomain: "kateika-d687d.firebaseapp.com",
  projectId: "kateika-d687d",
  storageBucket: "kateika-d687d.firebasestorage.app",
  messagingSenderId: "781009725914",
  appId: "1:781009725914:web:6706907fb10f56c51478e3",
  measurementId: "G-HQZVRGD0PZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. フォームの制御と送信処理
document.addEventListener("DOMContentLoaded", () => {
    const cardNumberInput = document.getElementById('card-number');
    const expiryDateInput = document.getElementById('expiry-date');
    const cvcInput = document.getElementById('cvc');
    const form = document.getElementById('payment-form');
    const submitBtn = document.querySelector('.submit-btn');

    // カード番号: 数字のみ許可し、4桁ごとにスペースを入れる
    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) formattedValue += ' ';
            formattedValue += value[i];
        }
        e.target.value = formattedValue;
    });

    // 有効期限: 数字のみ許可し、2桁の後に自動で '/' を入れる
    expiryDateInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 3) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });

    // CVC: 数字のみ許可する
    cvcInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });

    // フォーム送信時のFirebase連携処理
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 二重送信防止
        submitBtn.disabled = true;
        submitBtn.textContent = "処理中...";

        try {
            // ダミートークンの生成
            const dummyStripeToken = "tok_" + Math.random().toString(36).substring(2, 15);
            const cardName = document.getElementById('card-name').value;

            // Firebase Firestoreへ保存
            const docRef = await addDoc(collection(db, "payments"), {
                cardName: cardName,
                paymentToken: dummyStripeToken,
                status: "pending", 
                createdAt: new Date()
            });

            alert(`Firebaseへの送信が成功しました！\n保存されたドキュメントID: ${docRef.id}\n(※セキュリティ遵守のため、カードの生データは送信していません)`);
            form.reset();

        } catch (error) {
            console.error("Firebaseへの保存エラー: ", error);
            alert("エラーが発生しました。コンソールログまたはFirebaseの設定を確認してください。");
        } finally {
            // ボタンの状態を元に戻す
            submitBtn.disabled = false;
            submitBtn.textContent = "決済する";
        }
    });
});
