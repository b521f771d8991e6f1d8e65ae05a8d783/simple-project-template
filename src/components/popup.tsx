/**
 * Draggable + resizable popup/modal — matches the decisio Popup pattern
 * but without @radix-ui dependency.
 *
 * Features:
 * - Drag by title bar
 * - Resize from any edge or corner (8 handles)
 * - Optional backdrop overlay
 * - Configurable z-index for layering multiple popups
 * - Close on Escape or overlay click
 */
import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";

export interface PopupAction {
	label: string;
	onClick: () => void;
}

export interface PopupProps {
	open: boolean;
	onClose: () => void;
	title: string;
	actions?: PopupAction[];
	children: ReactNode;
	width?: string | number;
	maxWidth?: number;
	height?: string | number;
	dark?: boolean;
	/** z-index for the dialog (overlay is zIndex - 1). Default 51. */
	zIndex?: number;
	/** Show backdrop overlay. Default true. */
	overlay?: boolean;
	/** Initial position instead of centered. */
	initialPos?: { x: number; y: number };
	/** Minimum dimensions when resizing. */
	minWidth?: number;
	minHeight?: number;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLE_SIZE = 6;

const RESIZE_CURSORS: Record<ResizeDir, string> = {
	n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
	ne: "nesw-resize", nw: "nwse-resize", se: "nwse-resize", sw: "nesw-resize",
};

function resizeHandleStyle(dir: ResizeDir): React.CSSProperties {
	const base: React.CSSProperties = {
		position: "absolute",
		zIndex: 1,
		cursor: RESIZE_CURSORS[dir],
	};
	const h = HANDLE_SIZE;
	switch (dir) {
		case "n":  return { ...base, top: -h/2, left: h, right: h, height: h };
		case "s":  return { ...base, bottom: -h/2, left: h, right: h, height: h };
		case "e":  return { ...base, right: -h/2, top: h, bottom: h, width: h };
		case "w":  return { ...base, left: -h/2, top: h, bottom: h, width: h };
		case "ne": return { ...base, top: -h/2, right: -h/2, width: h * 2, height: h * 2 };
		case "nw": return { ...base, top: -h/2, left: -h/2, width: h * 2, height: h * 2 };
		case "se": return { ...base, bottom: -h/2, right: -h/2, width: h * 2, height: h * 2 };
		case "sw": return { ...base, bottom: -h/2, left: -h/2, width: h * 2, height: h * 2 };
	}
}

export function Popup({
	open,
	onClose,
	title,
	actions = [],
	children,
	width = "90vw",
	maxWidth = 1200,
	height = "85vh",
	dark = false,
	zIndex = 51,
	overlay = true,
	initialPos,
	minWidth = 200,
	minHeight = 150,
}: PopupProps) {
	const contentRef = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState<{ x: number; y: number } | null>(initialPos ?? null);
	const [size, setSize] = useState<{ w: number; h: number } | null>(null);
	const dragging = useRef(false);
	const dragOffset = useRef({ x: 0, y: 0 });

	useEffect(() => {
		if (!open) {
			setPos(initialPos ?? null);
			setSize(null);
		}
	}, [open]);

	// Close on Escape
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, onClose]);

	const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if ((e.target as HTMLElement).closest("button")) return;
		dragging.current = true;
		const rect = contentRef.current?.getBoundingClientRect();
		if (rect) {
			dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
		}
		const handleMove = (ev: MouseEvent) => {
			if (!dragging.current) return;
			setPos({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y });
		};
		const handleUp = () => {
			dragging.current = false;
			window.removeEventListener("mousemove", handleMove);
			window.removeEventListener("mouseup", handleUp);
		};
		window.addEventListener("mousemove", handleMove);
		window.addEventListener("mouseup", handleUp);
	}, []);

	const handleResizeStart = useCallback((dir: ResizeDir, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const rect = contentRef.current?.getBoundingClientRect();
		if (!rect) return;

		const startX = e.clientX;
		const startY = e.clientY;
		const startW = rect.width;
		const startH = rect.height;
		const startLeft = rect.left;
		const startTop = rect.top;

		const handleMove = (ev: MouseEvent) => {
			const dx = ev.clientX - startX;
			const dy = ev.clientY - startY;

			let newW = startW;
			let newH = startH;
			let newX = startLeft;
			let newY = startTop;

			if (dir.includes("e")) newW = Math.max(minWidth, startW + dx);
			if (dir.includes("w")) { newW = Math.max(minWidth, startW - dx); newX = startLeft + (startW - newW); }
			if (dir.includes("s")) newH = Math.max(minHeight, startH + dy);
			if (dir.includes("n")) { newH = Math.max(minHeight, startH - dy); newY = startTop + (startH - newH); }

			setSize({ w: newW, h: newH });
			setPos({ x: newX, y: newY });
		};
		const handleUp = () => {
			window.removeEventListener("mousemove", handleMove);
			window.removeEventListener("mouseup", handleUp);
		};
		window.addEventListener("mousemove", handleMove);
		window.addEventListener("mouseup", handleUp);
	}, [minWidth, minHeight]);

	if (!open) return null;

	const surface = dark ? "#1e1e1e" : "#ffffff";
	const border = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
	const textColor = dark ? "#e5e5e5" : "#1e293b";
	const textSecondary = dark ? "#a3a3a3" : "#64748b";

	return (
		<>
			{/* Overlay */}
			{overlay && (
				<div
					onClick={onClose}
					style={{
						position: "fixed",
						inset: 0,
						backgroundColor: "rgba(0,0,0,0.5)",
						zIndex: zIndex - 1,
						cursor: "pointer",
					}}
				/>
			)}
			{/* Dialog */}
			<div
				ref={contentRef}
				style={{
					position: "fixed",
					...(pos
						? { top: pos.y, left: pos.x, transform: "none" }
						: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
					),
					...(size
						? { width: size.w, height: size.h }
						: { width, maxWidth, height }
					),
					backgroundColor: surface,
					borderRadius: 12,
					display: "flex",
					flexDirection: "column",
					zIndex,
					overflow: "hidden",
					boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
				}}
			>
				{/* Resize handles */}
				{(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as ResizeDir[]).map((dir) => (
					<div
						key={dir}
						onMouseDown={(e) => handleResizeStart(dir, e)}
						style={resizeHandleStyle(dir)}
					/>
				))}
				{/* Title bar — draggable */}
				<div
					onMouseDown={handleDragStart}
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						position: "relative",
						padding: "10px 16px",
						borderBottom: `1px solid ${border}`,
						flexShrink: 0,
						cursor: "grab",
						userSelect: "none",
						backgroundColor: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
					}}
				>
					<span
						style={{
							fontSize: 14,
							fontWeight: 600,
							color: textColor,
							position: "absolute",
							left: "50%",
							transform: "translateX(-50%)",
							pointerEvents: "none",
						}}
					>
						{title}
					</span>
					<div />
					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						{actions.map((action, i) => (
							<button
								key={i}
								onClick={action.onClick}
								style={{
									padding: "5px 10px",
									backgroundColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
									color: textSecondary,
									border: "none",
									borderRadius: 6,
									fontSize: 12,
									fontWeight: 500,
									cursor: "pointer",
								}}
							>
								{action.label}
							</button>
						))}
						<button
							onClick={onClose}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								padding: 4,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: textSecondary,
								fontSize: 18,
								lineHeight: 1,
							}}
						>
							✕
						</button>
					</div>
				</div>
				{/* Content */}
				<div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
					{children}
				</div>
			</div>
		</>
	);
}
