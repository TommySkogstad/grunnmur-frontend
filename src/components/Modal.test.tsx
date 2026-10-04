/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useRef, useState } from 'react'
import { Modal } from './Modal'

afterEach(cleanup)

function Basic({ onClose = () => {}, ...rest }: Partial<React.ComponentProps<typeof Modal>>) {
  return (
    <Modal open title="Tittel" onClose={onClose} {...rest}>
      <button>Første</button>
      <button>Siste</button>
    </Modal>
  )
}

describe('Modal', () => {
  it('rendrer ingenting når open er false', () => {
    render(<Basic open={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('har dialog-semantikk med aria-modal og aria-labelledby mot tittelen', () => {
    render(<Basic />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const labelId = dialog.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    expect(document.getElementById(labelId!)?.textContent).toBe('Tittel')
    expect(screen.getByRole('dialog', { name: 'Tittel' })).toBe(dialog)
  })

  it('flytter fokus inn i dialogen ved åpning', () => {
    render(<Basic />)
    expect(document.activeElement).toBe(screen.getByText('Første'))
  })

  it('fokuserer initialFocusRef når den er satt', () => {
    function WithRef() {
      const ref = useRef<HTMLButtonElement>(null)
      return (
        <Modal open title="T" onClose={() => {}} initialFocusRef={ref}>
          <button>A</button>
          <button ref={ref}>B</button>
        </Modal>
      )
    }
    render(<WithRef />)
    expect(document.activeElement).toBe(screen.getByText('B'))
  })

  it('Tab fra siste knapp går til første', () => {
    render(<Basic />)
    const last = screen.getByText('Siste')
    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(document.activeElement).toBe(screen.getByText('Første'))
  })

  it('Shift+Tab fra første knapp går til siste', () => {
    render(<Basic />)
    const first = screen.getByText('Første')
    first.focus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(screen.getByText('Siste'))
  })

  it('Tab når fokus er utenfor dialogen henter fokus tilbake inn', () => {
    render(
      <div>
        <button>Utenfor</button>
        <Basic />
      </div>
    )
    const outside = screen.getByText('Utenfor')
    outside.focus()
    fireEvent.keyDown(outside, { key: 'Tab' })
    expect(document.activeElement).toBe(screen.getByText('Første'))
  })

  it('Escape kaller onClose', () => {
    const onClose = vi.fn()
    render(<Basic onClose={onClose} />)
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape gjør ingenting når closeOnEscape er false', () => {
    const onClose = vi.fn()
    render(<Basic onClose={onClose} closeOnEscape={false} />)
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('klikk utenfor lukker', () => {
    const onClose = vi.fn()
    render(<Basic onClose={onClose} />)
    fireEvent.mouseDown(screen.getByTestId('modal-overlay'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('klikk inne i dialogen lukker ikke', () => {
    const onClose = vi.fn()
    render(<Basic onClose={onClose} />)
    fireEvent.mouseDown(screen.getByRole('dialog'))
    fireEvent.mouseDown(screen.getByText('Første'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('klikk utenfor kan slås av', () => {
    const onClose = vi.fn()
    render(<Basic onClose={onClose} closeOnOverlayClick={false} />)
    fireEvent.mouseDown(screen.getByTestId('modal-overlay'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('gir fokus tilbake til elementet som åpnet dialogen', () => {
    function Host() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>Åpne</button>
          <Modal open={open} title="T" onClose={() => setOpen(false)}>
            <button>Inni</button>
          </Modal>
        </>
      )
    }
    render(<Host />)
    const opener = screen.getByText('Åpne')
    opener.focus()
    fireEvent.click(opener)
    expect(document.activeElement).toBe(screen.getByText('Inni'))
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it('fokuserer selve dialogen når den ikke har fokuserbare barn', () => {
    render(<Modal open title="T" onClose={() => {}}><p>Bare tekst</p></Modal>)
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
  })

  it('rendrer footer', () => {
    render(<Basic footer={<button>Lagre</button>} />)
    expect(screen.getByText('Lagre')).toBeTruthy()
  })
})
