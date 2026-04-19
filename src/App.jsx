import React from 'react';
import AuthProvider from './AuthProvider'; // ファイル名が修正済み前提

function App() {
  return (
    <div className="App">
      {/* AuthProvider がログイン状態をチェックし、
        ログイン済みなら自動的に ContentsProgress を表示してくれます 
      */}
      <AuthProvider />
    </div>
  );
}

export default App;