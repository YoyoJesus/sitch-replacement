<script lang="ts">
  import Icon from "@iconify/svelte";
  import emailjs from "@emailjs/browser";
  import { PUBLIC_EMAILJS_SERVICE_ID, PUBLIC_EMAILJS_TEMPLATE_ID, PUBLIC_EMAILJS_PUBLIC_KEY } from "$env/static/public";

  const links = [
    { href: "https://www.linkedin.com/in/austin-sternberg", icon: "simple-icons:linkedin", label: "LinkedIn" },
    { href: "https://github.com/yoyojesus", icon: "simple-icons:github", label: "GitHub" },
    { href: "https://www.asternberg.xyz", icon: "ph:globe-simple", label: "Website" },
    { href: "https://www.youtube.com/@yoyojesus", icon: "simple-icons:youtube", label: "YouTube" },
    { href: "https://blog.yoyojesus.xyz", icon: "ph:article", label: "Blog" },
  ];

  const skills = [
    { group: "Programming", items: "SvelteKit, PostgreSQL, Drizzle, Tailwind, Python, Flask" },
    { group: "Security", items: "Wireshark, Burp Suite, Active Directory, Entra, Linux" },
    { group: "Networking", items: "Nmap, Meshtastic, LoRa" },
    { group: "Other", items: "Docker, Podman, Typst" },
  ];

  let modalOpen = $state(false);
  let sending = $state(false);
  let toast = $state<{ message: string; isError: boolean } | null>(null);
  let toastTimer: ReturnType<typeof setTimeout>;
  let form: HTMLFormElement;
  let track = $state<{ name: string; artist: string; url: string; image: string | null; nowPlaying: boolean } | null>(
    null,
  );

  $effect(() => {
    fetch("/api/now-playing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (track = data))
      .catch(() => {});
  });

  $effect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
  });

  function showToast(message: string, isError = false) {
    toast = { message, isError };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = null), 5000);
  }

  function closeModal() {
    modalOpen = false;
    form.reset();
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    sending = true;

    try {
      await emailjs.sendForm(PUBLIC_EMAILJS_SERVICE_ID, PUBLIC_EMAILJS_TEMPLATE_ID, form, {
        publicKey: PUBLIC_EMAILJS_PUBLIC_KEY,
      });
      showToast("Message sent successfully! I'll get back to you soon.");
      closeModal();
    } catch (error) {
      console.error("EmailJS Error:", error);
      showToast("Failed to send message. Please try again.", true);
    } finally {
      sending = false;
    }
  }
</script>

<main class="card">
  <img class="avatar" src="/DSC_1254.JPG" alt="Austin Sternberg" />
  <h1 class="name">Austin Sternberg</h1>
  <p class="subtitle">CS Senior at Kent State University</p>
  <p class="location">Mentor, OH</p>

  <ul class="roles">
    <li>President of <a href="https://hacksu.com" target="_blank" rel="noopener">HacKSU</a></li>
    <li>President of <a href="https://ksucombat.club" target="_blank" rel="noopener">KSU Combat Robotics</a></li>
    <li>Former IT Intern at Awetomaton</li>
  </ul>

  <p class="bio">Into cybersecurity, networking, and building things.</p>

  <nav class="links" aria-label="Links">
    <a href="https://resume.asternberg.xyz" class="link link-primary">
      <Icon icon="ph:file-text" aria-hidden="true" />
      Resume
    </a>
    <button type="button" class="link" onclick={() => (modalOpen = true)}>
      <Icon icon="ph:envelope-simple" aria-hidden="true" />
      Email
    </button>
    <div class="links-social">
      {#each links as link (link.href)}
        <a href={link.href} class="link" target="_blank" rel="noopener" aria-label={link.label} title={link.label}>
          <Icon icon={link.icon} aria-hidden="true" />
        </a>
      {/each}
    </div>
  </nav>

  <section class="skills" aria-label="Skills">
    {#each skills as skill (skill.group)}
      <p><span>{skill.group}</span> {skill.items}</p>
    {/each}
  </section>

  <a
    class="now-playing"
    href={track?.url ?? "https://www.last.fm/user/yoyojesus"}
    target="_blank"
    rel="noopener"
  >
    <span class="record" class:spinning={track?.nowPlaying} aria-hidden="true">
      {#if track?.image}
        <img src={track.image} alt="" />
      {/if}
    </span>
    <span class="now-playing-text">
      {#if track}
        <span class="now-playing-track">{track.name}</span>
        <span class="now-playing-meta">{track.nowPlaying ? "Now playing" : "Last played"} · {track.artist}</span>
      {:else}
        <span class="now-playing-track">Listening on Last.fm</span>
        <span class="now-playing-meta">@yoyojesus</span>
      {/if}
    </span>
  </a>
</main>

<svelte:window onkeydown={(e) => e.key === "Escape" && modalOpen && closeModal()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="modal-overlay" class:active={modalOpen} onclick={(e) => e.target === e.currentTarget && closeModal()}>
  <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <button class="close-btn" aria-label="Close" onclick={closeModal}>
      <Icon icon="ph:x-bold" aria-hidden="true" />
    </button>

    <h2 id="modal-title" class="modal-title">Send me a message</h2>

    <form bind:this={form} class="contact-form" onsubmit={handleSubmit}>
      <div class="form-group">
        <label for="name" class="form-label">Name</label>
        <input type="text" id="name" name="name" required class="form-input" autocomplete="name" />
      </div>

      <div class="form-group">
        <label for="email" class="form-label">Email</label>
        <input type="email" id="email" name="email" required class="form-input" autocomplete="email" />
      </div>

      <div class="form-group">
        <label for="message" class="form-label">Message</label>
        <textarea id="message" name="message" rows="5" required class="form-input form-textarea"></textarea>
      </div>

      <button type="submit" class="submit-btn" disabled={sending}>{sending ? "Sending..." : "Send Message"}</button>
    </form>
  </div>
</div>

<div
  class="toast"
  class:active={toast}
  class:error={toast?.isError}
  class:success={toast && !toast.isError}
  role="status"
>
  <p class="toast-message">{toast?.message}</p>
</div>
