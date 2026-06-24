<script lang="ts">
	let { data } = $props();
</script>

<div class="admin-guides">
	<div class="header">
		<a href="/admin" class="back">← admin</a>
		<h1>guides</h1>
		<p class="sub">
			guides are hardcoded — edit <code>src/lib/guides.ts</code> and redeploy to add or update them.
		</p>
	</div>

	<div class="info-box">
		<strong>how to add a guide</strong>
		<ol>
			<li>Open <code>src/lib/guides.ts</code> in your editor.</li>
			<li>
				Add a new object to the <code>guides</code> array with a unique <code>slug</code>,
				<code>title</code>, <code>description</code>, <code>thumbnail</code>, <code>stack</code>,
				and <code>sections</code>.
			</li>
			<li>Commit and redeploy — the guide will appear at <code>/guides/your-slug</code>.</li>
		</ol>
	</div>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>title</th>
					<th>slug</th>
					<th>stack</th>
					<th>sections</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.guides as guide (guide.slug)}
					<tr>
						<td class="td-title">{guide.title}</td>
						<td class="td-mono">{guide.slug}</td>
						<td>
							<div class="pills">
								{#each guide.stack as tech}
									<span class="pill">{tech}</span>
								{/each}
							</div>
						</td>
						<td class="td-count">{guide.sectionCount}</td>
						<td>
							<a href="/guides/{guide.slug}" target="_blank" rel="noopener" class="view-btn"
								>view ↗</a
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.admin-guides {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.back {
		font-size: 0.85rem;
		color: #8a8f99;
		text-decoration: none;
		margin-bottom: 0.25rem;
		display: inline-block;
	}

	.back:hover {
		color: #fff;
	}

	h1 {
		font-size: clamp(1.6rem, 3vw, 2.4rem);
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.sub {
		font-size: 0.9rem;
		color: #8a8f99;
		margin: 0;
	}

	.sub code {
		font-family: 'SFMono-Regular', 'Consolas', monospace;
		font-size: 0.85em;
		background: #1c2027;
		padding: 0.1em 0.35em;
		border-radius: 4px;
		color: #a78bfa;
	}

	.info-box {
		background: #111827;
		border: 1px solid #1f2a37;
		border-radius: 10px;
		padding: 1.1rem 1.4rem;
		font-size: 0.88rem;
		color: #c9ced8;
		line-height: 1.7;
	}

	.info-box strong {
		display: block;
		color: #e8eaf0;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 0.6rem;
	}

	.info-box ol {
		margin: 0;
		padding-left: 1.25rem;
	}

	.info-box code {
		font-family: 'SFMono-Regular', 'Consolas', monospace;
		font-size: 0.85em;
		background: #1c2027;
		padding: 0.1em 0.35em;
		border-radius: 4px;
		color: #a78bfa;
	}

	.table-wrap {
		overflow-x: auto;
		border: 1px solid #1f2937;
		border-radius: 10px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
	}

	thead tr {
		border-bottom: 1px solid #1f2937;
	}

	th {
		text-align: left;
		padding: 0.7rem 1rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #8a8f99;
		font-weight: 600;
		white-space: nowrap;
	}

	td {
		padding: 0.85rem 1rem;
		color: #cdd0d6;
		vertical-align: middle;
		border-bottom: 1px solid #141820;
	}

	tr:last-child td {
		border-bottom: none;
	}

	tr:hover td {
		background: #0d1117;
	}

	.td-title {
		font-weight: 600;
		color: #e8eaf0;
	}

	.td-mono {
		font-family: 'SFMono-Regular', 'Consolas', monospace;
		font-size: 0.82rem;
		color: #a78bfa;
	}

	.td-count {
		text-align: center;
		color: #8a8f99;
	}

	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.pill {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		padding: 0.18rem 0.55rem;
		border-radius: 9999px;
		background: #1c2027;
		color: #8a8f99;
		border: 1px solid #2a2f38;
	}

	.view-btn {
		font-size: 0.82rem;
		font-weight: 600;
		color: #60a5fa;
		text-decoration: none;
		white-space: nowrap;
	}

	.view-btn:hover {
		text-decoration: underline;
	}
</style>
