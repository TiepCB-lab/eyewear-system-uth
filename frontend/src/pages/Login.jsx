import React, { useState } from 'react';
import axios from 'axios'; // Hoặc dùng apiClient của bạn

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Ngăn trang web tải lại
    setError(''); // Xóa lỗi cũ mỗi lần bấm nút

    try {
      // Gửi yêu cầu đăng nhập tới Backend PHP
      const response = await axios.post('http://localhost:8000/api/login', {
        email: email,
        password: password
      });

      // --- CHỈ KHI THÀNH CÔNG (Mã 200) MỚI CHẠY TIẾP ---
      console.log("Đăng nhập thành công!", response.data);
      
      // Lưu thông tin người dùng vào máy (localStorage)
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Chuyển hướng sang Dashboard
      alert("Chào mừng " + response.data.user.name);
      window.location.href = '/admin/dashboard'; 

    } catch (err) {
      // --- KHI SAI MẬT KHẨU HOẶC EMAIL (Mã 401) ---
      // Nó sẽ nhảy ngay vào đây và DỪNG LẠI, không chạy lệnh chuyển hướng ở trên
      if (err.response) {
        setError(err.response.data.message); // Hiện lỗi "Sai email hoặc mật khẩu!"
      } else {
        setError("Không thể kết nối đến máy chủ.");
      }
    }
  };

  return (
    <div style={{ maxWidth: '300px', margin: '100px auto', textAlign: 'center' }}>
      <h2>Đăng Nhập</h2>
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <input 
          type="password" 
          placeholder="Mật khẩu" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        
        {/* Hiển thị thông báo lỗi màu đỏ nếu có */}
        {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

        <button type="submit" style={{ width: '100%', padding: '10px', cursor: 'pointer' }}>
          Đăng nhập
        </button>
      </form>
    </div>
  );
}

export default Login;