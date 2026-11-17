import { gsap, bp, initSvgRectReveal } from './core/gsap';
import { setBtnPrimaryLabel } from './buttons';
import { CONTACT_ENDPOINT, EMAIL } from '../data/contact';
import { trackEvent } from './analytics';

export function initContact() {
  const section = document.querySelector<HTMLElement>('.sections-contactForm');
  if (!section) return;

  initSvgRectReveal(section);

  const formEl = section.querySelector<HTMLFormElement>('.parts-form');
  if (formEl) {
    initSvgRectReveal(formEl);
  }

  const state = {
    scrollRotation: 12,
    hoverProgress: 0,
  };
  let isHovered = false;
  let isFocused = false;
  let hoverTween: gsap.core.Tween | null = null;
  const ac = new AbortController();

  const updateHoverState = (active: boolean) => {
    hoverTween?.kill();
    hoverTween = gsap.to(state, {
      hoverProgress: active ? 1 : 0,
      duration: 0.6,
      ease: 'smooth-2',
    });
  };

  const mm = gsap.matchMedia();
  mm.add(
    {
      isDesktop: `(min-width: ${bp.lg}px)`,
      isMobile: `(max-width: ${bp.lg - 1}px)`,
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (ctx) => {
      const { isDesktop, reduceMotion } = ctx.conditions as { isDesktop: boolean; reduceMotion: boolean };
      if (reduceMotion) return;

      const headingTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          scrub: true,
          start: 'top bottom',
          end: 'bottom top',
        },
      });
      headingTl
        .to('.sections-contactForm__headingLeft', { x: isDesktop ? 75 : 25, ease: 'none' }, 0)
        .to('.sections-contactForm__headingRight', { x: isDesktop ? -75 : -25, ease: 'none' }, 0);

      let formTl: gsap.core.Timeline | null = null;
      const desktopAc = new AbortController();
      const tick = () => {
        if (!formEl) return;
        const rot = gsap.utils.interpolate(state.scrollRotation, 0, state.hoverProgress);
        gsap.set(formEl, { rotate: rot });
      };

      if (isDesktop && formEl) {
        state.scrollRotation = 12;
        state.hoverProgress = 0;
        gsap.set(formEl, { rotate: 12 });

        formTl = gsap.timeline({
          scrollTrigger: {
            trigger: formEl,
            start: 'top bottom',
            end: 'top center',
            scrub: true,
          },
        });
        formTl.to(state, { scrollRotation: 8, ease: 'none' });
        gsap.ticker.add(tick);

        formEl.addEventListener(
          'mouseenter',
          () => {
            isHovered = true;
            updateHoverState(true);
          },
          { signal: desktopAc.signal }
        );
        formEl.addEventListener(
          'mouseleave',
          () => {
            isHovered = false;
            if (!isFocused) updateHoverState(false);
          },
          { signal: desktopAc.signal }
        );
        formEl.addEventListener(
          'focusin',
          () => {
            isFocused = true;
            updateHoverState(true);
          },
          { signal: desktopAc.signal }
        );
        formEl.addEventListener(
          'focusout',
          (e) => {
            if (!formEl.contains(e.relatedTarget as Node | null)) {
              isFocused = false;
              if (!isHovered) updateHoverState(false);
            }
          },
          { signal: desktopAc.signal }
        );
      } else if (formEl) {
        gsap.set(formEl, { rotate: 0 });
      }

      return () => {
        desktopAc.abort();
        hoverTween?.kill();
        headingTl.kill();
        formTl?.kill();
        gsap.ticker.remove(tick);
      };
    }
  );

  // Form checkbox & client-side validation (UI-only)
  if (!formEl) return;

  // `/contact?service=<id>` (from "Discuss …" links on /services): seed an empty message.
  const serviceLabels: Record<string, string> = {
    'strategy-consulting': 'Strategy & Consulting',
    'design-branding': 'Design & Branding',
    'web-software-development': 'Web & Software Development',
    'mobile-app-development': 'Mobile App Development',
    'ai-automation': 'AI & Automation',
    'digital-marketing-growth': 'Digital Marketing & Growth',
    'business-development-outreach': 'Business Development & Outreach',
  };
  const serviceParam = new URLSearchParams(location.search).get('service');
  const messageEl = formEl.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
  if (serviceParam && serviceLabels[serviceParam] && messageEl && !messageEl.value.trim()) {
    messageEl.value = `I'd like to discuss ${serviceLabels[serviceParam]}. `;
  }

  const checkboxInput = formEl.querySelector<HTMLInputElement>('.parts-formCheckbox input[type="checkbox"]');
  const checkboxSvg = formEl.querySelector<SVGElement>('.parts-formCheckbox svg');
  if (checkboxInput && checkboxSvg) {
    const syncCheckbox = () => {
      checkboxSvg.classList.toggle('opacity-0', !checkboxInput.checked);
    };
    syncCheckbox();
    checkboxInput.addEventListener('change', syncCheckbox, { signal: ac.signal });
  }

  // Status live region (`#status-message` carries aria-live in the markup).
  const statusEl = formEl.querySelector<HTMLElement>('#status-message');
  const setStatus = (msg: string, tone: 'ok' | 'error') => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = `mt-20 form-status${tone === 'error' ? ' form-status--error' : ''}`;
    // alert for errors (assertive announcement), status for success.
    statusEl.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  };
  // While a POST is in flight: disable the submit row so double-clicks queue and
  // make inputs readonly (values stay visible/editable after; never disabled,
  // which would drop them from the payload and grey them out).
  const setSending = (busy: boolean) => {
    submitBtn?.toggleAttribute('disabled', busy);
    (submitBtn as HTMLButtonElement | null)?.setAttribute('aria-busy', String(busy));
    formEl.setAttribute('aria-busy', String(busy));
    textFields.forEach((f) => (f.readOnly = busy));
  };

  // The original form ships the submit <button> without a type attribute (defaults to submit).
  const submitBtn =
    formEl.querySelector<HTMLButtonElement>('button[type="submit"]') ??
    formEl.querySelector<HTMLButtonElement>('button[aria-label="Submit"]');
  // Label changes must go through setBtnPrimaryLabel: buttons.ts SplitTexts the
  // label spans and would revert a direct textContent write on re-split.
  const setBtn = (label: string) => setBtnPrimaryLabel(submitBtn, label);
  const textFields = Array.from(formEl.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input:not([type="hidden"]):not([type="checkbox"]), textarea'));

  // --- Per-field inline errors (Formspree `errors[]` mapping + client validation) ---
  const fieldError = (name: string) => formEl.querySelector<HTMLElement>(`#${name}-error`);
  const setFieldError = (input: HTMLElement, msg: string) => {
    const name = (input as HTMLInputElement).name;
    const el = fieldError(name);
    if (el) {
      el.textContent = msg;
      el.hidden = false;
    }
    input.setAttribute('aria-invalid', 'true');
    if (el) input.setAttribute('aria-describedby', `${name}-error`);
  };
  const clearFieldError = (input: HTMLInputElement | HTMLTextAreaElement) => {
    const el = fieldError(input.name);
    if (el) {
      el.textContent = '';
      el.hidden = true;
    }
    input.setAttribute('aria-invalid', 'false');
    input.removeAttribute('aria-describedby');
  };
  const clearAllFieldErrors = () => {
    formEl.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[name], textarea[name]').forEach((i) => {
      if (i.type !== 'hidden') clearFieldError(i);
    });
  };
  // Typing in a field clears its error immediately (standard inline-error UX).
  formEl.addEventListener(
    'input',
    (e) => {
      const t = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (t && t.name && t.type !== 'hidden' && t.getAttribute('aria-invalid') === 'true') {
        clearFieldError(t);
        if (statusEl?.getAttribute('role') === 'alert') {
          statusEl.textContent = '';
          statusEl.removeAttribute('role');
        }
      }
    },
    { signal: ac.signal }
  );

  formEl.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
    if (submitting) return;
    const inputs = Array.from(formEl.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[required], textarea[required], input[name], textarea[name]'));
    let valid = true;
    let firstInvalid: HTMLElement | null = null;
    clearAllFieldErrors();
    inputs.forEach((inp) => {
      if (inp.name === '_gotcha' || inp.type === 'hidden') return; // honeypot + metadata, never user-visible
      let fieldValid = true;
      let fieldMsg = 'This field is required.';
      if (inp.type === 'checkbox') {
        fieldValid = (inp as HTMLInputElement).checked;
        fieldMsg = 'Please confirm you have read and agree to the Terms of Service and Privacy Policy.';
      } else if (!inp.value.trim()) {
        fieldValid = false;
      } else if (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value.trim())) {
        fieldValid = false;
        fieldMsg = 'Please enter a valid email address.';
      }
      if (!fieldValid) {
        setFieldError(inp as HTMLElement, fieldMsg);
        if (!firstInvalid) {
          firstInvalid = inp as HTMLElement;
          valid = false;
        } else {
          valid = false;
        }
      } else {
        inp.setAttribute('aria-invalid', 'false');
      }
    });

    // The original form ships the submit <button> without a type attribute (defaults to submit).
    if (!valid) {
      setBtn('Submit');
      gsap.fromTo(formEl, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(2, 0.2)' });
      setStatus('Please complete the highlighted fields.', 'error');
      firstInvalid?.focus();
      return;
    }

    // Cool-down between successful submissions (in-memory; resets on navigation).
    if (lastSentAt && Date.now() - lastSentAt < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (Date.now() - lastSentAt)) / 1000);
      setStatus(`Your message was just sent — please wait ${wait}s before sending another.`, 'ok');
      setBtn('Submit');
      return;
    }

    // Honeypot: filled ⇒ a bot reached the field; accept silently, never send.
    const honeypot = formEl.querySelector<HTMLInputElement>('input[name="_gotcha"]');
    if (honeypot?.value) {
      setStatus('Thanks for reaching out.', 'ok');
      setBtn('Message Sent!');
      setSending(true);
      return;
    }

    if (!CONTACT_ENDPOINT) {
      // No endpoint configured (open-items A7): degrade to the owner's inbox.
      if (!EMAIL) {
        setStatus('We could not send your message automatically. Please book a call instead.', 'error');
        setBtn('Try again');
        return;
      }
      const value = (name: string) => (formEl.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() ?? '';
      const body = encodeURIComponent(`Name: ${value('name')}\nCompany: ${value('company')}\n\n${value('message')}`);
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Project enquiry from decbricks.com')}&body=${body}`;
      setStatus('Opening your email client — press send there and we will reply.', 'ok');
      setBtn('Message Sent!');
      formEl.reset();
      if (checkboxSvg) checkboxSvg.classList.add('opacity-0');
      return;
    }

    // Hidden metadata fields live in the markup (so no-JS POSTs carry _subject);
    // JS personalises them per submission.
    const subjectInput = formEl.querySelector<HTMLInputElement>('input[name="_subject"]');
    const senderName = (formEl.querySelector<HTMLInputElement>('input[name="name"]') as HTMLInputElement | null)?.value.trim();
    if (subjectInput) subjectInput.value = senderName ? `New enquiry from ${senderName} - Decbricks` : 'New enquiry from decbricks.com';
    const sourceInput = formEl.querySelector<HTMLInputElement>('input[name="source_page"]');
    if (sourceInput) sourceInput.value = location.pathname;

    setBtn('Sending…');
    setSending(true);
    submitting = true;
    currentAbort = new AbortController();
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      currentAbort?.abort();
    }, SUBMIT_TIMEOUT_MS);
    fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      body: new FormData(formEl),
      headers: { Accept: 'application/json' },
      signal: currentAbort.signal,
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus('Message sent. We will get back to you shortly.', 'ok');
          setBtn('Message Sent!');
          formEl.reset();
          clearAllFieldErrors();
          if (checkboxSvg) checkboxSvg.classList.add('opacity-0');
          lastSentAt = Date.now();
          setSending(false);
          statusEl?.focus(); // success confirmation is announced + focusable
          // Conversion event (T-10): confirmed success only, never the submit
          // click; no-op without analytics consent.
          trackEvent('contact_form_submitted', {
            form_location: location.pathname,
            service: new URLSearchParams(location.search).get('service') || undefined,
          });
          return;
        }
        // Non-OK: Formspree replies { errors: [{ field, message }] } on 4xx.
        let data: { errors?: Array<{ field?: string; message?: string }> } | null = null;
        try {
          data = await res.json();
        } catch {
          /* non-JSON error body — fall through to generic handling */
        }
        if (res.status === 429) {
          setStatus('You are sending messages too quickly. Please wait a moment and try again.', 'error');
          submitBtn?.focus();
          return;
        }
        const serverErrors = data?.errors ?? [];
        let firstServerInvalid: HTMLElement | null = null;
        const unmapped: string[] = [];
        serverErrors.forEach((err) => {
          const msg = err.message || 'Please check this field.';
          const input = err.field
            ? (formEl.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${err.field}"]`) as HTMLInputElement | HTMLTextAreaElement | null)
            : null;
          if (input && input.type !== 'hidden') {
            setFieldError(input as HTMLElement, msg);
            if (!firstServerInvalid) firstServerInvalid = input as HTMLElement;
          } else if (err.field) {
            unmapped.push(`${err.field}: ${msg}`);
          } else {
            unmapped.push(msg);
          }
        });
        if (firstServerInvalid || unmapped.length) {
          setStatus(unmapped.length ? unmapped.join(' ') : 'Please correct the highlighted fields and try again.', 'error');
          firstServerInvalid?.focus();
        } else {
          setStatus('Something went wrong sending your message. Please try again.', 'error');
          submitBtn?.focus();
        }
        setBtn('Try again');
      })
      .catch((err: unknown) => {
        if (currentAbort?.signal.aborted && !timedOut) return; // teardown aborted the request — stay silent
        if (timedOut) {
          setStatus('Sending took too long and was stopped. Your message is still here — please try again.', 'error');
        } else if (err instanceof TypeError) {
          setStatus('We could not reach the server. Check your connection and try again.', 'error');
        } else {
          setStatus('Something went wrong sending your message. Please try again.', 'error');
        }
        setBtn('Try again');
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        currentAbort = null;
        submitting = false;
        setSending(false);
      });
    },
    { signal: ac.signal }
  );

  return () => {
    ac.abort();
    currentAbort?.abort(); // abort any in-flight submission
    mm.revert();
  };
}

/** Wire constants for the Formspree POST. */
const SUBMIT_TIMEOUT_MS = 15000;
const COOLDOWN_MS = 20000;
let submitting = false;
let lastSentAt = 0;
let currentAbort: AbortController | null = null;
