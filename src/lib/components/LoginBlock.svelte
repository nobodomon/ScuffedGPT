<script lang="ts">
	import {
		getAuth,
		GoogleAuthProvider,
		signInWithEmailAndPassword,
		signInWithPopup
	} from 'firebase/auth'

	let email: string = ''
	let password: string = ''
	let loading = false
	let loginError = {
		status: false,
		message: ''
	}

	const handleLoginWithEmailPassword = async () => {
		loading = true
		try {
			const auth = getAuth()
			await signInWithEmailAndPassword(auth, email, password)
			auth.currentUser?.displayName;
			loading = false;
		} catch (error) {
			console.log('error');
			loading = false;
			(loginError.status = true), (loginError.message = 'Invalid email or password')
		}
	}

	const handleGoogleLogin = async () => {
		try {
			const auth = getAuth()
			const provider = new GoogleAuthProvider()
			await signInWithPopup(auth, provider)
		} catch (error) {
			console.log(error)
		}
	}
</script>

<div class="card w-96 bg-neutral text-neutral-content self-center">
	<div class="card-body">
		<h2 class="card-title">Login</h2>

		{#if loading}
		<progress class="progress progress-primary w-56"></progress>

		{:else}
		<form
			on:submit|preventDefault={() => handleLoginWithEmailPassword()}
			class="flex flex-col flex-wrap gap-4 justify-center h-full"
		>
			<div class="form-control w-full">
				<label class="label" for="email">
					<span class="label-text">Email</span>
				</label>
				<input
					id="email"
					type="text"
					placeholder="Email"
					class="input input-bordered w-full"
					bind:value={email}
				/>
			</div>
			<div class="form-control w-full">
				<label class="label" for="password">
					<span class="label-text">Password</span>
				</label>
				<input
					id="password"
					type="password"
					placeholder="Type here"
					class="input input-bordered w-full"
					autocomplete="current-password"
					bind:value={password}
				/>
			</div>
			<button type="submit" class="btn btn-primary w-full">Login</button>
			<button class="btn btn-primary w-full" on:click|preventDefault={() => handleGoogleLogin()}>
				Sign in with google</button
			>
			<div class="alert alert-error shadow-lg" class:hidden={!loginError.status}>
				<div>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current flex-shrink-0 h-6 w-6"
						on:click={() => (loginError.status = false)}
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					<span>{loginError.message}</span>
				</div>
			</div>
		</form>
		{/if}
	</div>
</div>
