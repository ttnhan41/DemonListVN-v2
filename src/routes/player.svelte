<script>
	import { page } from "$app/stores";
	import { createClient } from "@supabase/supabase-js";
	import Chart from "chart.js/auto";
	import LoadingAnimation from "../components/animations/LoadingAnimation.svelte";
	import EditProfileModal from "../components/modals/EditProfileModal.svelte";
	import AddRecordModal from "../components/modals/AddRecordModal.svelte";
	import EditRecordModal from "../components/modals/EditRecordModal.svelte";
	import MySubmissionsModal from "../components/modals/MySubmissionsModal.svelte";
	import Badge from "../components/badge.svelte";
	import { fly } from "svelte/transition";
	import { userdata } from "./stores";
	import { onMount } from "svelte";
	var id = $page.url.searchParams.get("id");
	const supabase = createClient(
		import.meta.env.VITE_DATABASE_API_URL,
		import.meta.env.VITE_DATABASE_API_KEY
	);
	var player;
	var list = 1;
	var flrec = [];
	var dlrec = [];
	var title = "";
	var currentRecord;
	var showEditProfileModal = false;
	var showAddRecordModal = false;
	var showEditRecordModal = false;
	var showMySubmissonsModal = false;
	var sortBy = "timestamp";
	var firstFetch = false;
	var avatarSrc = "";
	async function fetchPlayerData() {
		const testSrc = `https://qdwpenfblwdmhywwszzj.supabase.co/storage/v1/object/public/avatars/${$page.url.searchParams.get(
			"id"
		)}.jpg`;
		var res = await fetch(testSrc);
		if (res.ok) avatarSrc = testSrc;
		else
			avatarSrc =
				"https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Black_flag.svg/2560px-Black_flag.svg.png";
		const dat = await (
			await fetch(
				`${import.meta.env.VITE_BACKEND_API_URL}/player/${$page.url.searchParams.get("id")}`
			)
		).json();
		player = dat;
		title = dat.name;
		if (sortBy == "pt") {
			if (list == 0) sortBy = "dlPt";
			else if (list == 1) sortBy = "flPt";
		}
		const data = await (
			await fetch(
				`${import.meta.env.VITE_BACKEND_API_URL}/player/${$page.url.searchParams.get(
					"id"
				)}/records/${sortBy}`
			)
		).json();
		flrec = [];
		dlrec = [];
		for (const i in data) {
			if (data[i].flPt || data[i].flPt == 0) flrec.push(data[i]);
			if (data[i].dlPt || data[i].dlPt == 0) dlrec.push(data[i]);
		}
		if (dlrec.length && !firstFetch) {
			list = 0;
			firstFetch = true;
		}
		if (sortBy == "flPt" || sortBy == "dlPt") {
			sortBy = "pt";
		}
		createChart(getChartData(dlrec));
	}
	function getChartData(dlrec) {
		let sorted_records = JSON.parse(JSON.stringify(dlrec));
		sorted_records.sort((a, b) => {
			return a.timestamp - b.timestamp;
		});
		console.log(sorted_records);
		const ratings = [],
			timestamps = [];
		let maxPt = 0,
			totalPt = 0;
		for (const i of sorted_records) {
			maxPt = Math.max(maxPt, i.dlPt);
			totalPt += i.dlPt;
			ratings.push(Math.floor(maxPt + (totalPt * 25) / maxPt));
			timestamps.push(
				new Date(i.timestamp).toLocaleDateString("vi-VN") +
					"\n" +
					i.levels.name +
					"\n" +
					"by " +
					i.levels.creator
			);
		}
		return {
			ratings: ratings,
			timestamps: timestamps
		};
	}
	function getDiscordTag() {
		const tag = player.discord;
		const el = document.createElement("textarea");
		el.value = tag;
		document.body.appendChild(el);
		el.select();
		document.execCommand("copy");
		document.body.removeChild(el);
		alert("Copied tag to clipboard");
	}
	async function removeLevel(item, index) {
		if (list == 1) {
			flrec.splice(index, 1);
			flrec = flrec;
		} else if (list == 0) {
			dlrec.splice(index, 1);
			dlrec = dlrec;
		}
		fetch(`${import.meta.env.VITE_BACKEND_API_URL}/record/${item.userid}/${item.levelid}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				token: supabase.auth.session().access_token
			})
		});
	}
	function getID() {
		try {
			return $userdata.metadata.id;
		} catch {
			return null;
		}
	}
	function ifMobile(item) {
		if (item.mobile) return "Mobile ";
		return "";
	}
	function createChart(data) {
		Chart.defaults.color = "gray";
		new Chart("chart", {
			type: "line",
			data: {
				labels: data.timestamps,
				datasets: [
					{
						label: "Rating",
						data: data.ratings,
						borderWidth: 3,
						fill: false,
						pointHoverRadius: 10
					}
				]
			},
			options: {
				plugins: {
					tooltip: {
						xAlign: "center",
						yAlign: "top",
						caretSize: 0
					}
				},
				interaction: {
					intersect: false,
					mode: "index"
				},
				responsive: true,
				scales: {
					x: {
						display: false
					},
					y: {
						beginAtZero: false,
						grid: {
							display: false
						}
					}
				},
				elements: {
					point: {
						radius: 0
					}
				},
				animation: false,
				maintainAspectRatio: false
			}
		});
	}
	onMount(() => {
		fetchPlayerData();
	});
</script>

<svelte:head>
	{#if title}
		<title>{title}'s Info - Demon List VN</title>
		<meta name="description" content={`${title}'s Info`} />
		<meta name="keywords" content={title} />
	{/if}
</svelte:head>

{#if player}
	<div in:fly={{ y: 50, duration: 500, delay: 300 }}>
		{#if player.isHidden}
			<div class="warn">
				{#if player.uid == $userdata.metadata.id}
					<p>
						You are unranked because your profile is hidden. To make your profile visible, go to
						Edit profile > Make my profile visible.
					</p>
				{:else}
					<p>This profile is unranked because it's hidden.</p>
				{/if}
			</div>
		{/if}
		<div class="pageContent">
			<div class="playerInfoWidgetWrapper">
				<div class="playerInfoWidget">
					<div class="avatar">
						<img src={avatarSrc} alt="" />
					</div>
					<div class="playerNameWrapper">
						<Badge {player} size={15}>
							<span class="playerName">{player.name}</span>
						</Badge>
					</div>
					<span class="rating">Rating: {player.rating}</span>
					<div class="social">
						{#if player.youtube}
							<a href={player.youtube} target="_blank" class="iconWrapper">
								<svg
									id="youtube"
									xmlns="http://www.w3.org/2000/svg"
									width="36.126"
									height="25.385"
									viewBox="0 0 36.126 25.385"
								>
									<path
										id="youtube-2"
										data-name="youtube"
										d="M37.108,13.2a13.949,13.949,0,0,0-1.493-6.777,4.792,4.792,0,0,0-2.823-1.641,128.6,128.6,0,0,0-13.735-.509A128.732,128.732,0,0,0,5.371,4.77a4.71,4.71,0,0,0-2.4,1.214C1.5,7.346,1.334,9.676,1.17,11.646a79.243,79.243,0,0,0,0,10.634,15.672,15.672,0,0,0,.492,3.282,5.153,5.153,0,0,0,1.165,2.232,4.693,4.693,0,0,0,2.445,1.28,74.141,74.141,0,0,0,10.667.542c5.744.082,10.782,0,16.739-.459a4.726,4.726,0,0,0,2.511-1.28,4.086,4.086,0,0,0,1-1.641,17.362,17.362,0,0,0,.853-5.58C37.108,19.736,37.108,14.189,37.108,13.2ZM15.348,21.64V11.482l9.715,5.1C22.339,18.1,18.745,19.8,15.348,21.64Z"
										transform="translate(-0.991 -4.258)"
										fill="var(--textColor)"
									/>
								</svg>
							</a>
						{/if}
						{#if player.facebook}
							<a href={player.facebook} target="_blank" class="iconWrapper">
								<svg
									id="facebook"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 30 30"
									width="90px"
									height="90px"
								>
									<path
										d="M15,3C8.373,3,3,8.373,3,15c0,6.016,4.432,10.984,10.206,11.852V18.18h-2.969v-3.154h2.969v-2.099c0-3.475,1.693-5,4.581-5 c1.383,0,2.115,0.103,2.461,0.149v2.753h-1.97c-1.226,0-1.654,1.163-1.654,2.473v1.724h3.593L19.73,18.18h-3.106v8.697 C22.481,26.083,27,21.075,27,15C27,8.373,21.627,3,15,3z"
									/></svg
								>
							</a>
						{/if}
						{#if player.discord}
							<span class="iconWrapper clickable" on:click={getDiscordTag}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="33.004"
									height="24.429"
									viewBox="0 0 33.004 24.429"
								>
									<path
										id="discord"
										d="M11.745,5.177c-1.118,0-4.489,1.367-5.093,1.64A5.805,5.805,0,0,0,4.613,9.352c-.762,1.408-1.374,3.053-2.368,5.474S1.02,21.914,1.053,23.339s.2,2.536,1.656,3.379a32.463,32.463,0,0,0,4.108,2.253c1.358.53,2.285.911,2.915.381a4.735,4.735,0,0,0,1.044-1.457s.6-.828-.53-1.325-1.689-.845-1.64-1.359.132-.795.414-.728a7.034,7.034,0,0,0,3.5,1.805,23.518,23.518,0,0,0,5.038.464,23.518,23.518,0,0,0,5.038-.464,7.034,7.034,0,0,0,3.5-1.805c.282-.066.364.215.414.728s-.513.862-1.64,1.359-.53,1.325-.53,1.325a4.735,4.735,0,0,0,1.044,1.457c.629.53,1.557.149,2.915-.381A32.46,32.46,0,0,0,32.4,26.717c1.459-.843,1.623-1.954,1.656-3.379s-.2-6.092-1.192-8.513-1.606-4.066-2.368-5.474a5.805,5.805,0,0,0-2.038-2.534c-.6-.273-3.975-1.64-5.093-1.64a1.505,1.505,0,0,0-1.449.779l-.389.862a29.91,29.91,0,0,0-3.952-.5,30.458,30.458,0,0,0-3.987.5l-.389-.862a1.505,1.505,0,0,0-1.449-.779Zm.122,10.336h.041A3.075,3.075,0,0,1,14.859,18.7a3.075,3.075,0,0,1-2.951,3.186A3.075,3.075,0,0,1,8.956,18.7a3.079,3.079,0,0,1,2.91-3.186Zm11.331,0h.041a3.079,3.079,0,0,1,2.91,3.186A3.075,3.075,0,0,1,23.2,21.884,3.075,3.075,0,0,1,20.246,18.7,3.075,3.075,0,0,1,23.2,15.513Z"
										transform="translate(-1.05 -5.177)"
										fill="var(--textColor)"
									/>
								</svg>
							</span>
						{/if}
					</div>
					{#if player.province}
						<div class="addr">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="20"
								viewBox="0 -960 960 960"
								width="20"
								><path
									d="M480.212-480Q510-480 531-501.212q21-21.213 21-51Q552-582 530.788-603q-21.213-21-51-21Q450-624 429-602.788q-21 21.213-21 51Q408-522 429.212-501q21.213 21 51 21ZM480-191q119-107 179.5-197T720-549q0-105-68.5-174T480-792q-103 0-171.5 69T240-549q0 71 60.5 161T480-191Zm0 95Q323.025-227.108 245.512-339.554 168-452 168-549q0-134 89-224.5T479.5-864q133.5 0 223 90.5T792-549q0 97-77 209T480-96Zm0-456Z"
								/></svg
							>
							<p>
								{#if player.city && player.city != player.province}{player.city}, {/if}{player.province}
							</p>
						</div>
					{/if}
				</div>
				<div class="statWidget">
					<span class="statTitle">Stats</span><br />
					<span>Rating: {player.rating} (#{player.overallRank})</span><br />
					<span>Demon List: {player.totalDLpt} (#{player.dlrank})</span><br />
					<span>Featured List: {player.totalFLpt} (#{player.flrank})</span><br />
				</div>
				{#if id == getID()}
					<span
						class="editProfile clickable"
						on:click={() => {
							showEditProfileModal = !showEditProfileModal;
						}}
					>
						<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"
							><path
								d="M5 19h1.4l8.625-8.625-1.4-1.4L5 17.6ZM19.3 8.925l-4.25-4.2 1.4-1.4q.575-.575 1.413-.575.837 0 1.412.575l1.4 1.4q.575.575.6 1.388.025.812-.55 1.387ZM17.85 10.4 7.25 21H3v-4.25l10.6-10.6Zm-3.525-.725-.7-.7 1.4 1.4Z"
							/></svg
						>
						<span>Edit profile</span>
					</span>
					<span
						class="editProfile clickable"
						on:click={() => {
							showMySubmissonsModal = !showMySubmissonsModal;
						}}
					>
						<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"
							><path
								d="M4 21q-.825 0-1.412-.587Q2 19.825 2 19V5q0-.825.588-1.413Q3.175 3 4 3h16q.825 0 1.413.587Q22 4.175 22 5v14q0 .825-.587 1.413Q20.825 21 20 21Zm0-2h16V5H4v14Zm1-2h5v-2H5Zm9.55-2 4.95-4.95-1.425-1.425-3.525 3.55-1.425-1.425-1.4 1.425ZM5 13h5v-2H5Zm0-4h5V7H5ZM4 19V5v14Z"
							/></svg
						>
						<span>My submissions</span>
					</span>
				{/if}
			</div>
			<div class="mainWrapper">
				<div class="chartWrapper">
					<canvas id="chart" />
				</div>
				<div class="selectWrapper">
					<div class="listSelect">
						<div class="showRecordFrom">
							<span>Show records from</span>
						</div>
						<select bind:value={list} on:change={fetchPlayerData}>
							{#if dlrec.length}
								<option value={0} selected={true}>Demon List</option>
							{/if}
							{#if flrec.length}
								<option value={1}>Featured List</option>
							{/if}
						</select>
					</div>
					<div class="listSelect">
						<div class="showRecordFrom">
							<span>Sort by</span>
						</div>
						<select bind:value={sortBy} on:change={fetchPlayerData}>
							<option value={"timestamp"} selected={true}>Submit time</option>
							<option value={"pt"}>Point</option>
							{#if list == 0}
								<option value={"progress"}>Progress</option>
							{/if}
							<option value={"levelid"}>Level ID</option>
						</select>
					</div>
				</div>

				<div class="playersListWrapper">
					<div class="playersList">
						<div class="playerName">
							<p>Level name</p>
							{#if $userdata.data.isAdmin}
								<svg
									on:click={() => (showAddRecordModal = !showAddRecordModal)}
									xmlns="http://www.w3.org/2000/svg"
									height="24"
									width="24"><path d="M11 19v-6H5v-2h6V5h2v6h6v2h-6v6Z" /></svg
								>
							{/if}
						</div>
						<div class="playerPt">
							<p>Point</p>
						</div>
					</div>
					{#each list == 0 ? dlrec : flrec as item, index}
						<div class="playersList" id={index % 2 ? "" : "highlight2"}>
							<div class="playerName">
								<a href={`/level?id=${item.levelid}`}
									>{item.levels.name} ({ifMobile(item)}{item.refreshRate}fps) <br />
									<span id="creatorName">by {item.levels.creator}</span></a
								>
							</div>
							<div class="playerPt">
								<a href={item.videoLink} id="center"
									>{list == 0 ? item.dlPt : item.flPt}
									<br id="abcs" />{#if list == 0}({item.progress}%){/if}</a
								>
								{#if $userdata.data.isAdmin}
									<span
										on:click={() => {
											currentRecord = item;
											showEditRecordModal = !showEditRecordModal;
										}}
										><svg id="forAdmin" xmlns="http://www.w3.org/2000/svg" height="24" width="24"
											><path
												d="M5 19h1.4l8.625-8.625-1.4-1.4L5 17.6ZM19.3 8.925l-4.25-4.2 1.4-1.4q.575-.575 1.413-.575.837 0 1.412.575l1.4 1.4q.575.575.6 1.388.025.812-.55 1.387ZM17.85 10.4 7.25 21H3v-4.25l10.6-10.6Zm-3.525-.725-.7-.7 1.4 1.4Z"
											/></svg
										></span
									>
									<span on:click={() => removeLevel(item, index)}
										><svg id="forAdmin" xmlns="http://www.w3.org/2000/svg" height="24" width="24"
											><path
												d="M7 21q-.825 0-1.412-.587Q5 19.825 5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413Q17.825 21 17 21ZM17 6H7v13h10ZM9 17h2V8H9Zm4 0h2V8h-2ZM7 6v13Z"
											/></svg
										></span
									>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
		{#if id == getID()}
			<EditProfileModal bind:ifShow={showEditProfileModal} />
			<MySubmissionsModal bind:ifShow={showMySubmissonsModal} bind:uid={id} />
		{/if}
		{#if $userdata.data.isAdmin}
			<AddRecordModal bind:ifShow={showAddRecordModal} bind:player />
			{#if currentRecord}
				<EditRecordModal
					bind:ifShow={showEditRecordModal}
					bind:player
					bind:record={currentRecord}
				/>
			{/if}
		{/if}
	</div>
{:else}
	<LoadingAnimation />
{/if}

<style lang="scss">
	.addr {
		display: flex;
		align-items: center;
		svg {
			fill: var(--textColor);
		}
	}
	#creatorName {
		color: var(--color7);
	}
	.chartWrapper {
		height: 250px;
		width: 100%;
		background-color: var(--color23);
		padding: 30px;
		padding-top: 20px;
		padding-bottom: 20px;
		box-sizing: border-box;
		border-radius: 50px;
		margin-bottom: 50px;
	}
	.selectWrapper {
		display: flex;
		gap: 12px;
	}
	.statWidget {
		background-color: var(--color23);
		height: fit-content;
		width: 100%;
		margin-top: 35px;
		border-radius: 50px;
		padding: 30px;
		padding-top: 20px;
		padding-bottom: 20px;
		box-sizing: border-box;
		span {
			color: var(--color7);
		}
		.statTitle {
			color: var(--textColor);
			font-size: 20px;
			font-weight: bold;
		}
	}

	.rating {
		margin-top: 10px;
	}
	#facebook {
		fill: var(--textColor);
		scale: 0.75;
	}
	#center {
		text-align: center;
	}
	#abcs {
		display: none;
	}
	#videoLink {
		margin-left: 3px;
	}
	.pageContent {
		display: grid;
		width: 70%;
		margin-inline: auto;
		margin-bottom: 100px;
		gap: 30px;
		grid-template-areas:
			"info main main"
			"info main main"
			"info main main";
		grid-template-columns: 28% 33.25% 33.25%;
		grid-template-rows: 195px;
	}
	.warn {
		width: 70%;
		background-color: rgb(66, 62, 1);
		height: fit-content;
		box-sizing: border-box;
		padding-inline: 18px;
		padding-top: 1px;
		padding-bottom: 1px;
		border-radius: 20px;
		margin-inline: auto;
		margin-bottom: 35px;
		color: yellow;
	}
	.avatar {
		background-color: black;
		margin-bottom: 30px;
		width: 12.5vw;
		height: 12.5vw;
		margin-inline: auto;
		border-radius: 50%;
		border-color: var(--textColor);
		border-style: solid;
		img {
			height: 100%;
			width: 100%;
			object-fit: cover;
			border-radius: 50%;
		}
	}
	.playerName {
		font-size: 30px;
		font-weight: 500;
		svg {
			fill: var(--textColor);
		}
	}
	.playerInfoWidget {
		height: fit-content;
		width: 100%;
		border-radius: 50px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 40px;
		padding-bottom: 40px;
		background-color: var(--color23);
	}
	.playerInfoWidgetWrapper {
		grid-area: info;
		height: fit-content;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.fltop {
		grid-area: fltop;
	}
	.dltop {
		grid-area: dltop;
	}
	.topWidget {
		height: 180px;
		border-radius: 50px;
		background-color: var(--color23);
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding-inline: 50px;
	}
	.topTitle {
		font-size: 24px;
		margin-top: 0;
		margin-bottom: 0;
	}
	.top {
		font-size: 65px;
		margin-top: 0;
		margin-bottom: 0;
		color: var(--color13);
		font-weight: 300;
	}
	.social {
		margin-top: 8px;
		display: flex;
		align-items: center;
		.iconWrapper {
			width: 40px;
			height: 40px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 15px;
			svg {
				transform: scale(0.8);
			}
		}
	}
	.listSelect {
		height: 50px;
		width: 100%;
		border-radius: 50px;
		display: flex;
		align-items: center;
		margin-bottom: 30px;
		.showRecordFrom {
			height: 100%;
			width: 175px;
			background-color: var(--color23);
			border-radius: 50px 0 0 50px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		select {
			width: calc(100% - 175px);
			height: 100%;
			border-radius: 0 50px 50px 0;
			background-color: var(--color21);
			border-color: var(--color21);
			color: var(--color8);
			padding-inline: 10px;
		}
	}
	#highlight2 {
		background-color: var(--color23);
	}
	.playersListWrapper {
		display: flex;
		flex-direction: column;
	}
	.playersList {
		height: fit-content;
		display: flex;
		border-radius: 50px;
		padding-top: 10px;
		padding-bottom: 10px;
		a {
			color: var(--textColor);
			text-decoration: none;
		}
		.playerName {
			display: flex;
			align-items: center;
			font-size: 16px;
			width: 80%;
			height: 100%;
			p {
				margin-left: 40px;
			}
			a {
				margin-left: 40px;
			}
		}
		.playerPt {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 20%;
			height: 100%;
			svg {
				fill: var(--textColor);
				margin-left: 15px;
			}
		}
	}
	.editProfile {
		background-color: var(--color23);
		height: 80px;
		width: 100%;
		border-radius: 50px;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 30px;
		color: var(--textColor);
		text-decoration: none;
		svg {
			fill: var(--textColor);
			margin-right: 10px;
		}
	}
	.mainWrapper {
		grid-area: main;
	}
	@media screen and (max-width: 1450px) {
		.pageContent {
			width: 80%;
			.avatar {
				margin-top: 35px;
				width: 14vw;
				height: 14vw;
			}
		}
		.warn {
			width: 80%;
		}
		.playerInfoWidget {
			padding-top: 0px;
			padding-bottom: 30px;
			.avatar {
				margin-bottom: 30px;
			}
			.playerName {
				font-size: 26px;
			}
		}
		.selectWrapper {
			flex-direction: column;
		}
	}
	@media screen and (max-width: 1100px) {
		#abcs {
			display: block;
		}
		.pageContent {
			gap: 15px;
			width: 90%;
			grid-template-areas:
				"warn"
				"info"
				"fltop"
				"dltop"
				"main";
			grid-template-columns: 100%;
			grid-template-rows: inherit;
			.avatar {
				margin-top: 35px;
				width: 50vw;
				height: 50vw;
			}
		}
		.warn {
			width: 90%;
			margin-bottom: 0px;
		}
		.playerPt {
			margin-right: 20px;
		}
	}
</style>
