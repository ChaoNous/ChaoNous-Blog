export function createJsonRequest({ onUnauthorized }) {
	return async function request(path, options) {
		const response = await fetch(path, {
			credentials: "same-origin",
			headers: {
				Accept: "application/json",
				...(options && options.headers ? options.headers : {}),
			},
			...options,
		});

		if (!response.ok) {
			let message = "\u8bf7\u6c42\u5931\u8d25\u3002";
			try {
				const payload = await response.json();
				message = payload.message || message;
			} catch {
				/* ignore */
			}

			if (response.status === 401 && typeof onUnauthorized === "function") {
				onUnauthorized(message);
			}

			throw new Error(message);
		}

		return response.json();
	};
}

export async function downloadExport(type) {
	const response = await fetch(
		`/api/admin/export?type=${encodeURIComponent(type)}`,
		{
			credentials: "same-origin",
		},
	);

	if (!response.ok) {
		let message = "\u5bfc\u51fa\u5931\u8d25\u3002";
		try {
			const payload = await response.json();
			message = payload.message || message;
		} catch {
			/* ignore */
		}
		throw new Error(message);
	}

	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download =
		type === "analytics"
			? "chaonous-analytics-export.json"
			: "chaonous-comments-export.json";
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}
