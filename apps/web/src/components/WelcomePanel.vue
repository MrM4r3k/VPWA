<template>
  <section class="welcome-page">
    <div class="welcome-content">
      <img src="../assets/logo.png" alt="App logo" class="welcome-logo" />
      <h1 class="welcome-title">Welcome to Loom Chat</h1>
      <p class="welcome-subtitle">
        Select a conversation from the sidebar to start chatting, or create a new one
        to connect with your contacts.
      </p>

      <div class="welcome-grid">
        <div class="welcome-card">
          <q-icon name="chat_bubble" size="28px" class="welcome-icon" />
          <div>Instant Messaging</div>
        </div>
        <div class="welcome-card">
          <q-icon name="groups" size="28px" class="welcome-icon" />
          <div>Group Chats</div>
        </div>
        <div class="welcome-card">
          <q-icon name="verified_user" size="28px" class="welcome-icon" />
          <div>Secure & Private</div>
        </div>
        <div class="welcome-card">
          <q-icon name="bolt" size="28px" class="welcome-icon" />
          <div>Fast & Reliable</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'WelcomePanel' });
</script>

<style scoped>

.welcome-page {            
  display: flex;                  
  align-items: center;
  justify-content: center;
  padding: 100px;
  color: #e5e7eb;
  box-sizing: border-box;
  padding-left: 320px;
}

.welcome-content {
  text-align: center;
  max-width: 900px;
  width: 100%;
  padding: 48px 32px;
}


.welcome-logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 0px;
}

.welcome-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 8px;
}

.welcome-subtitle {
  max-width: 520px;
  margin: 0 auto 32px;
  color: #8b92f98d;
  font-size: 1rem;
  line-height: 1.6;
}

.welcome-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.welcome-card {
  background: rgba(24, 26, 31, 0.9);
  backdrop-filter: blur(6px);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  transition: background 0.2s ease, transform 0.2s ease;
}

.welcome-card:hover {
  background: rgba(88, 101, 242, 0.12);
  transform: translateY(-3px);
}

.welcome-icon {
  color: #8b93f9;
  margin-bottom: 6px;
}

/* 🔹 Responsivita */
@media (max-width: 480px) {
  .welcome-content {
    padding: 32px 16px;
  }

  .welcome-grid {
    grid-template-columns: 1fr;
  }

  .welcome-title {
    font-size: 1.4rem;
  }
}
</style>
