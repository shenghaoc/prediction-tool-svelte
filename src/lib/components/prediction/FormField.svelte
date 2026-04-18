<script lang="ts">
	export let label: string;
	export let forId: string;
	export let error = '';
	export let fullWidth = false;
</script>

<div class:prediction-field-full={fullWidth} class="prediction-field">
	<label for={forId}>{label}</label>
	<slot />
	{#if error}
		<p class="prediction-error">{error}</p>
	{/if}
</div>
