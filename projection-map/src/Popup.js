import React from 'react';

// Using Arwes-like HTML/CSS structure since we set up the variables in index.css
// and we want to avoid complex dependency issues with the full Arwes library if unnecessary.
// We implement a simple Frame-like container using the provided CSS styles.

const Popup = ({ event, position, onClose }) => {
    if (!event) return null;

    return (
        <div
            style={{
                width: '300px',
                padding: '2px', // simulation of border width
                background: 'linear-gradient(to bottom right, var(--arwes-color-primary) 0%, transparent 20%, transparent 80%, var(--arwes-color-primary) 100%)',
                position: 'relative',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
            }}
        >
            <div style={{
                background: 'var(--arwes-color-bg-elevated)',
                padding: '1rem',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                border: '1px solid var(--arwes-color-primary-dim)',
                boxShadow: '0 0 10px var(--arwes-color-primary-glow)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{
                        margin: 0,
                        fontFamily: 'Protomolecule, sans-serif',
                        color: 'var(--arwes-color-primary)',
                        fontSize: '1.2rem',
                        textShadow: '0 0 5px var(--arwes-color-primary-glow)'
                    }}>
                        {event.location}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--arwes-color-error)',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            fontFamily: 'Protomolecule, sans-serif'
                        }}
                    >
                        x
                    </button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--arwes-color-secondary)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Now</div>
                    <div style={{ color: 'var(--arwes-color-text)', fontWeight: 'bold' }}>
                        {event.now ? event.now.title : 'No current event'}
                    </div>
                    {event.now && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--arwes-color-text-dim)' }}>
                            {event.now.time}
                        </div>
                    )}
                </div>

                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--arwes-color-secondary)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Next</div>
                    <div style={{ color: 'var(--arwes-color-text)', fontWeight: 'bold' }}>
                        {event.next ? event.next.title : 'No upcoming events'}
                    </div>
                    {event.next && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--arwes-color-text-dim)' }}>
                            {event.next.time}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Popup;
