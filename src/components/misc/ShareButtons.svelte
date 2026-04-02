<script lang="ts">
	import Icon from "@iconify/svelte";
	import QRCode from "qrcode";
	import I18nKey from "../../i18n/i18nKey";
	import { i18n } from "../../i18n/translation";

	export let title: string;
	export let url: string;
	export let description = "";
	export let author: string;
	export let pubDate: string;
	export let coverImage: string | null = null;
	export let avatar: string | null = null;
	export let siteTitle: string;

	let showQRCode = false;
	let qrCodeDataUrl = "";
	let copied = false;
	let showPoster = false;
	let posterImage: string | null = null;
	let generating = false;
	let themeColor = "#558e88";

	const COPY_FEEDBACK_DURATION = 2000;

	// 分享平台配置
	const sharePlatforms = [
		{
			name: "微信",
			icon: "ri:wechat-fill",
			color: "#07c160",
			action: () => {
				showQRCode = !showQRCode;
				if (showQRCode && !qrCodeDataUrl) {
					generateQRCode();
				}
			},
		},
		{
			name: "微博",
			icon: "ri:weibo-fill",
			color: "#e6162d",
			action: () => {
				const shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
				window.open(shareUrl, "_blank", "width=600,height=400");
			},
		},
		{
			name: "Twitter",
			icon: "ri:twitter-x-fill",
			color: "#000000",
			action: () => {
				const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
				window.open(shareUrl, "_blank", "width=600,height=400");
			},
		},
		{
			name: "Facebook",
			icon: "ri:facebook-fill",
			color: "#1877f2",
			action: () => {
				const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
				window.open(shareUrl, "_blank", "width=600,height=400");
			},
		},
	];

	async function generateQRCode() {
		try {
			qrCodeDataUrl = await QRCode.toDataURL(url, {
				margin: 2,
				width: 200,
				color: { dark: "#000000", light: "#ffffff" },
			});
		} catch (error) {
			console.error("Failed to generate QR code:", error);
		}
	}

	async function copyLink() {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url);
			} else {
				const textarea = document.createElement("textarea");
				textarea.value = url;
				textarea.style.position = "fixed";
				textarea.style.left = "-9999px";
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand("copy");
				document.body.removeChild(textarea);
			}

			copied = true;
			setTimeout(() => {
				copied = false;
			}, COPY_FEEDBACK_DURATION);
		} catch (error) {
			console.error("Failed to copy link:", error);
		}
	}

	// 生成分享海报
	const SCALE = 2;
	const WIDTH = 425 * SCALE;
	const PADDING = 24 * SCALE;
	const CONTENT_WIDTH = WIDTH - PADDING * 2;
	const FONT_FAMILY = "'Crimson Pro', 'Zhuque Fangsong UI', Georgia, serif";

	function getLines(
		ctx: CanvasRenderingContext2D,
		text: string,
		maxWidth: number,
	): string[] {
		const lines: string[] = [];
		let currentLine = "";

		for (const char of text) {
			if (ctx.measureText(currentLine + char).width < maxWidth) {
				currentLine += char;
			} else {
				lines.push(currentLine);
				currentLine = char;
			}
		}

		if (currentLine) lines.push(currentLine);
		return lines;
	}

	function drawRoundedRect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number,
	): void {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
	}

	async function loadImage(src: string): Promise<HTMLImageElement | null> {
		return new Promise((resolve) => {
			const img = new Image();
			img.crossOrigin = "anonymous";

			img.onload = () => resolve(img);
			img.onerror = () => {
				if (src.includes("images.weserv.nl") || src.startsWith("data:")) {
					resolve(null);
					return;
				}
				const proxyImg = new Image();
				proxyImg.crossOrigin = "anonymous";
				proxyImg.onload = () => resolve(proxyImg);
				proxyImg.onerror = () => resolve(null);
				proxyImg.src = `https://images.weserv.nl/?url=${encodeURIComponent(src)}&output=png`;
			};

			img.src = src;
		});
	}

	async function generatePoster() {
		showPoster = true;
		if (posterImage) return;

		generating = true;
		try {
			const qrCodeUrl = await QRCode.toDataURL(url, {
				margin: 1,
				width: 100 * SCALE,
				color: { dark: "#000000", light: "#ffffff" },
			});

			const [qrImg, coverImg, avatarImg] = await Promise.all([
				loadImage(qrCodeUrl),
				coverImage ? loadImage(coverImage) : Promise.resolve(null),
				avatar ? loadImage(avatar) : Promise.resolve(null),
			]);

			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Canvas context not available");

			const coverHeight = (coverImage ? 200 : 120) * SCALE;
			const titleFontSize = 24 * SCALE;
			const descFontSize = 14 * SCALE;
			const qrSize = 80 * SCALE;

			ctx.font = `700 ${titleFontSize}px ${FONT_FAMILY}`;
			const titleLines = getLines(ctx, title, CONTENT_WIDTH);
			const titleLineHeight = 30 * SCALE;
			const titleHeight = titleLines.length * titleLineHeight;

			let descHeight = 0;
			if (description) {
				ctx.font = `${descFontSize}px ${FONT_FAMILY}`;
				const descLines = getLines(ctx, description, CONTENT_WIDTH - 16 * SCALE);
				descHeight = Math.min(descLines.length, 6) * (25 * SCALE);
			}

			const canvasHeight =
				coverHeight +
				PADDING +
				titleHeight +
				16 * SCALE +
				descHeight +
				(description ? 24 * SCALE : 8 * SCALE) +
				24 * SCALE +
				qrSize +
				PADDING;

			canvas.width = WIDTH;
			canvas.height = canvasHeight;

			// 背景
			ctx.fillStyle = "#ffffff";
			drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, 16 * SCALE);
			ctx.fill();

			// 装饰圆
			ctx.save();
			ctx.globalAlpha = 0.1;
			ctx.fillStyle = themeColor;
			ctx.beginPath();
			ctx.arc(WIDTH - 25 * SCALE, 25 * SCALE, 75 * SCALE, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(10 * SCALE, canvas.height - 10 * SCALE, 50 * SCALE, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();

			// 封面图
			if (coverImg) {
				const imgRatio = coverImg.width / coverImg.height;
				const targetRatio = WIDTH / coverHeight;
				let sx: number, sy: number, sWidth: number, sHeight: number;

				if (imgRatio > targetRatio) {
					sHeight = coverImg.height;
					sWidth = sHeight * targetRatio;
					sx = (coverImg.width - sWidth) / 2;
					sy = 0;
				} else {
					sWidth = coverImg.width;
					sHeight = sWidth / targetRatio;
					sx = 0;
					sy = (coverImg.height - sHeight) / 2;
				}
				ctx.drawImage(coverImg, sx, sy, sWidth, sHeight, 0, 0, WIDTH, coverHeight);
			} else {
				ctx.save();
				ctx.fillStyle = themeColor;
				ctx.globalAlpha = 0.2;
				ctx.fillRect(0, 0, WIDTH, coverHeight);
				ctx.restore();
			}

			// 日期徽章
			const dateObj = parseDate(pubDate);
			if (dateObj) {
				const dateBoxW = 60 * SCALE;
				const dateBoxH = 60 * SCALE;
				const dateBoxX = PADDING;
				const dateBoxY = coverHeight - dateBoxH;

				ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
				drawRoundedRect(ctx, dateBoxX, dateBoxY, dateBoxW, dateBoxH, 4 * SCALE);
				ctx.fill();

				ctx.fillStyle = "#ffffff";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.font = `700 ${30 * SCALE}px ${FONT_FAMILY}`;
				ctx.fillText(dateObj.day, dateBoxX + dateBoxW / 2, dateBoxY + 24 * SCALE);

				ctx.beginPath();
				ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
				ctx.lineWidth = 1 * SCALE;
				ctx.moveTo(dateBoxX + 10 * SCALE, dateBoxY + 42 * SCALE);
				ctx.lineTo(dateBoxX + dateBoxW - 10 * SCALE, dateBoxY + 42 * SCALE);
				ctx.stroke();

				ctx.font = `${10 * SCALE}px ${FONT_FAMILY}`;
				ctx.fillText(`${dateObj.year} ${dateObj.month}`, dateBoxX + dateBoxW / 2, dateBoxY + 51 * SCALE);
			}

			// 标题
			let drawY = coverHeight + PADDING;
			ctx.textBaseline = "top";
			ctx.textAlign = "left";
			ctx.font = `700 ${titleFontSize}px ${FONT_FAMILY}`;
			ctx.fillStyle = "#111827";
			for (const line of titleLines) {
				ctx.fillText(line, PADDING, drawY);
				drawY += titleLineHeight;
			}
			drawY += 16 * SCALE - (titleLineHeight - titleFontSize);

			// 描述
			if (description) {
				ctx.fillStyle = "#e5e7eb";
				drawRoundedRect(ctx, PADDING, drawY - 8 * SCALE, 4 * SCALE, descHeight + 8 * SCALE, 2 * SCALE);
				ctx.fill();

				ctx.font = `${descFontSize}px ${FONT_FAMILY}`;
				ctx.fillStyle = "#4b5563";
				const descLines = getLines(ctx, description, CONTENT_WIDTH - 16 * SCALE);
				for (const line of descLines.slice(0, 6)) {
					ctx.fillText(line, PADDING + 16 * SCALE, drawY);
					drawY += 25 * SCALE;
				}
			} else {
				drawY += 8 * SCALE;
			}

			// 分隔线
			drawY += 24 * SCALE;
			ctx.beginPath();
			ctx.strokeStyle = "#f3f4f6";
			ctx.lineWidth = 1 * SCALE;
			ctx.moveTo(PADDING, drawY);
			ctx.lineTo(WIDTH - PADDING, drawY);
			ctx.stroke();
			drawY += 16 * SCALE;

			// 页脚
			const footerY = drawY;
			const qrX = WIDTH - PADDING - qrSize;

			ctx.fillStyle = "#ffffff";
			ctx.shadowColor = "rgba(0, 0, 0, 0.05)";
			ctx.shadowBlur = 4 * SCALE;
			ctx.shadowOffsetY = 2 * SCALE;
			drawRoundedRect(ctx, qrX, footerY, qrSize, qrSize, 4 * SCALE);
			ctx.fill();
			ctx.shadowColor = "transparent";

			if (qrImg) {
				const qrInnerSize = 76 * SCALE;
				const qrPadding = (qrSize - qrInnerSize) / 2;
				ctx.drawImage(qrImg, qrX + qrPadding, footerY + qrPadding, qrInnerSize, qrInnerSize);
			}

			if (avatarImg) {
				ctx.save();
				const avatarSize = 64 * SCALE;
				const avatarX = PADDING;
				ctx.beginPath();
				ctx.arc(avatarX + avatarSize / 2, footerY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
				ctx.closePath();
				ctx.clip();
				ctx.drawImage(avatarImg, avatarX, footerY, avatarSize, avatarSize);
				ctx.restore();

				ctx.beginPath();
				ctx.arc(avatarX + avatarSize / 2, footerY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
				ctx.strokeStyle = "#ffffff";
				ctx.lineWidth = 2 * SCALE;
				ctx.stroke();
			}

			const avatarOffset = avatar ? 64 * SCALE + 16 * SCALE : 0;
			const textX = PADDING + avatarOffset;

			ctx.fillStyle = "#9ca3af";
			ctx.font = `${12 * SCALE}px ${FONT_FAMILY}`;
			ctx.fillText(i18n(I18nKey.author), textX, footerY + 4 * SCALE);

			ctx.fillStyle = "#1f2937";
			ctx.font = `700 ${20 * SCALE}px ${FONT_FAMILY}`;
			ctx.fillText(author, textX, footerY + 20 * SCALE);

			ctx.fillStyle = "#1f2937";
			ctx.font = `700 ${18 * SCALE}px ${FONT_FAMILY}`;
			ctx.fillText(i18n(I18nKey.scanToRead), textX, footerY + 50 * SCALE);

			posterImage = canvas.toDataURL("image/png");
		} catch (error) {
			console.error("Failed to generate poster:", error);
		} finally {
			generating = false;
		}
	}

	function parseDate(dateStr: string): { day: string; month: string; year: string } | null {
		try {
			const d = new Date(dateStr);
			if (Number.isNaN(d.getTime())) return null;
			return {
				day: d.getDate().toString().padStart(2, "0"),
				month: (d.getMonth() + 1).toString().padStart(2, "0"),
				year: d.getFullYear().toString(),
			};
		} catch {
			return null;
		}
	}

	function downloadPoster() {
		if (posterImage) {
			const a = document.createElement("a");
			a.href = posterImage;
			a.download = `share-${title.replace(/\s+/g, "-")}.png`;
			a.click();
		}
	}

	function closeModal() {
		showPoster = false;
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			},
		};
	}
</script>

<div class="share-buttons-wrapper">
	<!-- 分享平台按钮 -->
	<div class="share-platforms">
		{#each sharePlatforms as platform}
			<button
				class="share-btn"
				style="--btn-color: {platform.color}"
				on:click={platform.action}
				aria-label="分享到{platform.name}"
				title="分享到{platform.name}"
			>
				<Icon icon={platform.icon} width="20" height="20" />
			</button>
		{/each}
	</div>

	<!-- 复制链接按钮 -->
	<button
		class="share-btn copy-btn"
		on:click={copyLink}
		aria-label="复制链接"
		title="复制链接"
	>
		{#if copied}
			<Icon icon="material-symbols:check" width="20" height="20" />
		{:else}
			<Icon icon="material-symbols:link" width="20" height="20" />
		{/if}
		{#if copied}
			<span class="btn-text">{i18n(I18nKey.copied)}</span>
		{/if}
	</button>

	<!-- 生成海报按钮 -->
	<button
		class="share-btn poster-btn"
		on:click={generatePoster}
		aria-label="生成分享海报"
		title="生成分享海报"
	>
		<Icon icon="material-symbols:android-now-wallpaper" width="20" height="20" />
	</button>

	<!-- 微信二维码弹窗 -->
	{#if showQRCode}
		<div class="qrcode-popup">
			<div class="qrcode-content">
				<div class="qrcode-title">微信扫码分享</div>
				{#if qrCodeDataUrl}
					<img src={qrCodeDataUrl} alt="QR Code" class="qrcode-image" />
				{:else}
					<div class="qrcode-loading">生成中...</div>
				{/if}
				<div class="qrcode-hint">打开微信扫一扫</div>
			</div>
		</div>
	{/if}
</div>

<!-- 海报弹窗 -->
{#if showPoster}
	<div
		use:portal
		class="poster-modal"
		on:click={closeModal}
	>
		<div
			class="poster-content"
			on:click|stopPropagation
		>
			<div class="poster-image-wrapper">
				{#if posterImage}
					<img src={posterImage} alt="Share Poster" class="poster-image" />
				{:else}
					<div class="poster-loading">
						<div class="spinner"></div>
						<span>{i18n(I18nKey.generatingPoster)}</span>
					</div>
				{/if}
			</div>

			<div class="poster-actions">
				<button class="poster-btn copy-link" on:click={copyLink}>
					{#if copied}
						<Icon icon="material-symbols:check" width="18" height="18" />
						<span>{i18n(I18nKey.copied)}</span>
					{:else}
						<Icon icon="material-symbols:link" width="18" height="18" />
						<span>{i18n(I18nKey.copyLink)}</span>
					{/if}
				</button>
				<button class="poster-btn download" on:click={downloadPoster} disabled={!posterImage}>
					<Icon icon="material-symbols:download" width="18" height="18" />
					<span>{i18n(I18nKey.savePoster)}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.share-buttons-wrapper {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		position: relative;
	}

	.share-platforms {
		display: flex;
		gap: 0.5rem;
	}

	.share-btn {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.625rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--btn-regular-bg);
		border: 1px solid var(--line-divider);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.share-btn:hover {
		background: var(--btn-regular-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.share-btn:active {
		transform: translateY(0);
	}

	.share-btn[style*="--btn-color"]:hover {
		background: var(--btn-color);
		color: white;
		border-color: var(--btn-color);
	}

	.copy-btn,
	.poster-btn {
		background: var(--primary);
		color: white;
		border-color: var(--primary);
	}

	.copy-btn:hover,
	.poster-btn:hover {
		filter: brightness(1.1);
	}

	.btn-text {
		font-size: 0.75rem;
		position: absolute;
		bottom: -1.25rem;
		left: 50%;
		transform: translateX(-50%);
		white-space: nowrap;
		color: var(--primary);
	}

	/* 二维码弹窗 */
	.qrcode-popup {
		position: absolute;
		bottom: calc(100% + 0.75rem);
		left: 50%;
		transform: translateX(-50%);
		background: var(--card-bg);
		border: 1px solid var(--line-divider);
		border-radius: 0.75rem;
		padding: 1rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		z-index: 100;
	}

	.qrcode-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.qrcode-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.qrcode-image {
		width: 150px;
		height: 150px;
		border-radius: 0.5rem;
	}

	.qrcode-loading {
		width: 150px;
		height: 150px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
	}

	.qrcode-hint {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	/* 海报弹窗 */
	.poster-modal {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		padding: 1rem;
	}

	.poster-content {
		background: var(--card-bg);
		border-radius: 1rem;
		max-width: 28rem;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.poster-image-wrapper {
		padding: 1.5rem;
		display: flex;
		justify-content: center;
		min-height: 200px;
		align-items: center;
	}

	.poster-image {
		max-width: 100%;
		max-height: 60vh;
		border-radius: 0.5rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	.poster-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		color: var(--text-secondary);
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid var(--line-divider);
		border-top-color: var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.poster-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		padding: 1rem;
		border-top: 1px solid var(--line-divider);
	}

	.poster-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.poster-btn.copy-link {
		background: var(--btn-regular-bg);
		color: var(--text-primary);
	}

	.poster-btn.copy-link:hover {
		background: var(--btn-regular-bg-hover);
	}

	.poster-btn.download {
		background: var(--primary);
		color: white;
	}

	.poster-btn.download:hover {
		filter: brightness(1.1);
	}

	.poster-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.share-btn {
			width: 2.25rem;
			height: 2.25rem;
		}

		.qrcode-popup {
			position: fixed;
			bottom: auto;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	}
</style>