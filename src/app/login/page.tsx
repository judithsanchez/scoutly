'use client';

import LoginForm from '@/components/LoginForm';
import {Navbar} from '@/components/Navbar';

export default function LoginPage() {
	return (
		<>
			<Navbar />
			<main
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: '80vh',
					background: 'var(--demo-modal-icon-bg)',
				}}
			>
				<div
					style={{
						width: '100%',
						maxWidth: '28rem',
						padding: '2rem',
						marginTop: '2rem',
						background: '#fff',
						borderRadius: '0.75rem',
						boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
						border: '1px solid #e5e7eb',
					}}
				>
					<h1
						style={{
							fontSize: '1.5rem',
							fontWeight: 700,
							marginBottom: '1.5rem',
							textAlign: 'center',
							color: 'var(--demo-modal-icon)',
						}}
					>
						Login
					</h1>
					<LoginForm />
				</div>
			</main>
		</>
	);
}
