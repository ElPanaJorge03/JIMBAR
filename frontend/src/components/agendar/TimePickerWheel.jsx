import { useState, useRef, useEffect } from 'react';

// CSS for the scroll snap functionality
const wheelStyles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        background: '#1a1a1a',
        padding: '30px 20px',
        borderRadius: '16px',
        userSelect: 'none',
    },
    column: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '80px',
    },
    header: {
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '700',
        marginBottom: '20px',
    },
    window: {
        height: '240px', // 5 items * 48px height
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE
        position: 'relative',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 35%, black 65%, transparent)',
        maskImage: 'linear-gradient(to bottom, transparent, black 35%, black 65%, transparent)',
    },
    paddingBlock: {
        height: '96px', // (240 / 2) - (48 / 2)
    },
    item: {
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        scrollSnapAlign: 'center',
        fontSize: '2.5rem',
        color: '#444',
        transition: 'color 0.2s, font-size 0.2s',
        cursor: 'pointer',
    },
    itemActive: {
        color: '#fff',
        fontSize: '3rem',
        fontWeight: '300',
    }
};

function WheelColumn({ items, value, onChange, label }) {
    const scrollRef = useRef(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeout = useRef(null);

    // Auto-scroll to selected value initially or when explicitly told by parent
    useEffect(() => {
        if (!scrollRef.current || isScrolling) return;
        const index = items.findIndex(item => item.value === value);
        if (index !== -1) {
            scrollRef.current.scrollTo({ top: index * 48, behavior: 'smooth' });
        }
    }, [value, items]);

    const handleScroll = (e) => {
        const el = e.target;
        setIsScrolling(true);

        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            setIsScrolling(false);
            const index = Math.round(el.scrollTop / 48);
            if (items[index] && items[index].value !== value) {
                onChange(items[index].value);
            }
        }, 150); // wait for snap to finish
    };

    const handleItemClick = (index) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: index * 48, behavior: 'smooth' });
        }
    };

    return (
        <div style={wheelStyles.column}>
            <div style={wheelStyles.header}>{label}</div>
            <div
                ref={scrollRef}
                style={wheelStyles.window}
                onScroll={handleScroll}
                className="hide-scrollbar"
            >
                <div style={wheelStyles.paddingBlock} />
                {items.map((item, i) => (
                    <div
                        key={item.value}
                        onClick={() => handleItemClick(i)}
                        style={{
                            ...wheelStyles.item,
                            ...(item.value === value ? wheelStyles.itemActive : {})
                        }}
                    >
                        {item.label}
                    </div>
                ))}
                <div style={wheelStyles.paddingBlock} />
            </div>
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
}

export default function TimePickerWheel({ slots, selectedSlot, onSlotChange }) {
    // Extract hours and minutes from slots (hora_inicio format: 'HH:MM')
    const availableHours = [...new Set(slots.map(s => s.hora_inicio.split(':')[0]))].sort();

    // States to keep track of wheels
    const [selectedHour, setSelectedHour] = useState(selectedSlot ? selectedSlot.hora_inicio.split(':')[0] : availableHours[0]);

    // Available minutes for the currently selected hour
    const availableMinutes = slots
        .filter(s => s.hora_inicio.startsWith(selectedHour + ':'))
        .map(s => s.hora_inicio.split(':')[1])
        .sort();

    const [selectedMinute, setSelectedMinute] = useState(selectedSlot ? selectedSlot.hora_inicio.split(':')[1] : availableMinutes[0]);

    // Sync state whenever slots change
    useEffect(() => {
        if (slots.length > 0) {
            // Auto-select first slot if none is selected
            if (!selectedSlot) {
                const h = slots[0].hora_inicio.split(':')[0];
                const m = slots[0].hora_inicio.split(':')[1];
                setSelectedHour(h);
                setSelectedMinute(m);
                onSlotChange(slots[0]);
            }
        } else {
            onSlotChange(null);
        }
    }, [slots]);

    // When hour changes, validate minute and update overall slot
    const handleHourChange = (newHour) => {
        setSelectedHour(newHour);
        const newMinutes = slots
            .filter(s => s.hora_inicio.startsWith(newHour + ':'))
            .map(s => s.hora_inicio.split(':')[1])
            .sort();

        let minToSet = selectedMinute;
        if (!newMinutes.includes(selectedMinute)) {
            minToSet = newMinutes[0]; // fallback to first available minute if invalid
        }

        setSelectedMinute(minToSet);

        const matchedSlot = slots.find(s => s.hora_inicio === `${newHour}:${minToSet}`);
        if (matchedSlot) onSlotChange(matchedSlot);
    };

    // When minute changes, update overall slot
    const handleMinuteChange = (newMin) => {
        setSelectedMinute(newMin);
        const matchedSlot = slots.find(s => s.hora_inicio === `${selectedHour}:${newMin}`);
        if (matchedSlot) onSlotChange(matchedSlot);
    };

    if (!slots || slots.length === 0) return null;

    return (
        <div style={wheelStyles.container}>
            <WheelColumn
                label="h"
                items={availableHours.map(h => ({ value: h, label: h }))}
                value={selectedHour}
                onChange={handleHourChange}
            />
            <WheelColumn
                label="min"
                items={availableMinutes.map(m => ({ value: m, label: m }))}
                value={selectedMinute}
                onChange={handleMinuteChange}
            />
        </div>
    );
}

