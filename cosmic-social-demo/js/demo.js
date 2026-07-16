(() => {
  const root = document.documentElement;

  const setActive = (items, active) => {
    items.forEach((item) =>
      item.classList.toggle('is-active', item === active),
    );
  };

  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const buttons = Array.from(scope.querySelectorAll('[data-filter]'));
    const cards = Array.from(scope.querySelectorAll('[data-category]'));

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter') || 'all';
        setActive(buttons, button);
        cards.forEach((card) => {
          const category = card.getAttribute('data-category') || '';
          card.hidden = filter !== 'all' && category !== filter;
        });
      });
    });
  });

  document.querySelectorAll('[data-like]').forEach((button) => {
    button.addEventListener('click', () => {
      const countNode = button.querySelector('[data-like-count]');
      const current = Number(countNode?.textContent || '0');
      const liked = button.classList.toggle('is-liked');
      if (countNode)
        countNode.textContent = String(Math.max(0, current + (liked ? 1 : -1)));
      button.setAttribute('aria-pressed', String(liked));
    });
  });

  document.querySelectorAll('[data-blog-list]').forEach((list) => {
    const buttons = Array.from(list.querySelectorAll('[data-blog]'));
    const reader = document.querySelector(
      `[data-reader="${list.getAttribute('data-blog-list')}"]`,
    );
    if (!reader) return;

    const title = reader.querySelector('[data-reader-title]');
    const meta = reader.querySelector('[data-reader-meta]');
    const body = reader.querySelector('[data-reader-body]');

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        setActive(buttons, button);
        if (title) title.textContent = button.getAttribute('data-title') || '';
        if (meta) meta.textContent = button.getAttribute('data-meta') || '';
        if (body) body.textContent = button.getAttribute('data-body') || '';
      });
    });
  });

  document.querySelectorAll('[data-ask-form]').forEach((form) => {
    const input = form.querySelector('[name="name"]');
    const textarea = form.querySelector('[name="question"]');
    const list = document.querySelector(
      `[data-question-list="${form.getAttribute('data-ask-form')}"]`,
    );

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const question = textarea?.value.trim() || '';
      const name = input?.value.trim() || '匿名访客';
      if (question.length < 6) {
        textarea?.focus();
        textarea?.setAttribute('aria-invalid', 'true');
        return;
      }

      textarea?.removeAttribute('aria-invalid');
      const card = document.createElement('article');
      card.className = 'question-card';
      card.innerHTML = `
        <span class="chip hot">new signal</span>
        <h3>${escapeHtml(question)}</h3>
        <p>来自 ${escapeHtml(name)}，已进入匿名收件箱。这个 demo 不会真实提交数据。</p>
      `;
      list?.prepend(card);
      form.reset();
    });
  });

  document.querySelectorAll('[data-signal-game]').forEach((game) => {
    const buttons = Array.from(game.querySelectorAll('[data-signal]'));
    const status = game.querySelector('[data-signal-status]');
    const collected = new Set();

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-signal') || '';
        collected.add(id);
        button.classList.add('is-collected');

        if (collected.size === buttons.length) {
          document.body.classList.add('constellation-mode');
          game.classList.add('signal-unlocked');
          if (status) status.textContent = '彩蛋已解锁：Jyangbly Signal Mode';
        } else if (status) {
          status.textContent = `已收集 ${collected.size}/${buttons.length} 个信号碎片`;
        }
      });
    });
  });

  document.querySelectorAll('.brand-orb').forEach((orb) => {
    let taps = 0;
    orb.addEventListener('click', () => {
      taps += 1;
      if (taps >= 3) {
        root.style.setProperty('--accent', 'oklch(74% 0.19 330)');
        document.body.classList.add('constellation-mode');
      }
    });
  });

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return entities[char] || char;
    });
  }
})();
