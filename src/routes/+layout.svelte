<script lang="ts">
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
  <title>Austin Sternberg</title>
</svelte:head>

{@render children()}
