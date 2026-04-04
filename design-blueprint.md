# UI/UX Blueprint: Modern Dark SaaS (Linear / Base44 Aesthetic)
Этот документ содержит строгие инструкции по визуальному стилю проекта. Не начинай работу над этими шагами, пока не будут завершены все базовые логические шаги (1-10) из `project-architecture.md`.

## Глобальные правила дизайна (ОБЯЗАТЕЛЬНО К ИСПОЛНЕНИЮ)
1. **Строгие пропорции:** Элементы должны быть вписаны органично в композицию. Не делай кнопки, инпуты или шрифты непропорционально большими. Человек должен смотреть на интерфейс и видеть реальный премиальный продукт, а не типичную "раздутую" ИИ-генерацию.
2. **Палитра:** Никакого чистого черного или ярких цветов. Используем палитру `zinc`. Фон — `bg-zinc-950`. Карточки — `bg-zinc-900/30` или `bg-zinc-900/50`. Текст — `text-zinc-200` для акцентов и `text-zinc-400` для описаний.
3. **Рамки (Borders):** Весь дизайн строится на тончайших линиях. Используй `border border-white/5` или `border-white/10`. Никаких теней (box-shadow), кроме мягких свечений (glows).
4. **Типографика:** Шрифт Geist Sans или Inter. Плотный трекинг (letter-spacing) для заголовков.

---

### 🎨 UI-Шаг 1: Настройка глобального стиля (Tailwind & CSS)
I want to [настроить глобальную дизайн-систему, tailwind.config.ts и globals.css] so that [проект получил базу для стиля Modern Dark SaaS].

First, read these files completely before responding:
* #design-blueprint.md

Here is a reference to what I want to achieve:
Настройка CSS-переменных, добавление утилит для glassmorphism, тонких рамок и радиусов скругления.
Here's what makes this reference work:
* Always используй строгие значения: радиусы `rounded-xl` или `rounded-2xl`, никаких кругов.
* Always отключи стандартные кольца фокуса (ring/outline) у инпутов и замени их на аккуратное изменение бордера (например, `focus:border-zinc-500`).
* Never не добавляй лишние цвета в палитру. Только монохром + 1 акцентный цвет (например, приглушенный синий `blue-500/50` для свечений).

SUCCESS BRIEF
* Type of output: Код для `tailwind.config.ts`, `globals.css` и `layout.tsx` (подключение шрифта).
* Success means: Приложение готово к сборке премиальных компонентов без лишнего шума.

DO NOT start executing yet. Ask clarifying questions.
Give me your execution plan (max 3 steps). Only begin work once we've aligned.

---

### 🎨 UI-Шаг 2: Идеальный Hero Блок (Главная страница)
I want to [переписать Hero-блок на главной странице] so that [он выглядел как дорогой лендинг, в точности передавая эстетику Base44].

First, read these files completely before responding:
* #design-blueprint.md
* app/page.tsx (текущий черновик)

Here is a reference to what I want to achieve:
Крупный, но аккуратный заголовок по центру, под ним приглушенное описание, ниже — компактный и стильный инпут для ввода URL с кнопкой внутри.
Here's what makes this reference work:
* Always вписывай элементы органично. Инпут не должен быть на пол-экрана. Сохраняй изящные размеры (`h-10` или `h-12` максимум).
* Always делай кнопку анализа частью инпута (внутри бордера), чтобы это смотрелось монолитно.
* Never не используй яркие градиенты на кнопках. Сделай кнопку матовой (`bg-white text-black` или `bg-zinc-800 text-white` с тонким бордером).

SUCCESS BRIEF
* Type of output: Код компонента `Hero` и обновление `page.tsx`.
* Success means: Главная страница вызывает "вау-эффект", элементы не выглядят дешевой ИИ-генерацией.

DO NOT start executing yet. Ask clarifying questions.
Give me your execution plan. Only begin work once we've aligned.

---

### 🎨 UI-Шаг 3: Сетка преимуществ (Bento Grid)
I want to [создать блок с описанием фич в формате Bento Grid] so that [показать возможности платформы стильно и лаконично].

First, read these files completely before responding:
* #design-blueprint.md

Here is a reference to what I want to achieve:
Асимметричная сетка из 3-4 карточек. Каждая карточка имеет фон `zinc-900/40`, тонкую рамку и содержит иконку Lucide + текст.
Here's what makes this reference work:
* Always используй эффект свечения при наведении (hover:bg-zinc-800/50) и плавную анимацию (`transition-all duration-300`).
* Always соблюдай отступы. Внутри карточки должен быть "воздух" (`p-6` или `p-8`). Иконки не должны быть гигантскими (размер `w-5 h-5` или `w-6 h-6`, цвет `text-zinc-400`).
* Never не перегружай карточки текстом.

SUCCESS BRIEF
* Type of output: Код компонента `FeaturesBento` для лендинга.
* Success means: Сетка выглядит премиально, карточки идеально выровнены.

DO NOT start executing yet. Ask clarifying questions.
Give me your execution plan. Only begin work once we've aligned.

---

### 🎨 UI-Шаг 4: Полировка Дашборда и Графиков Tremor
I want to [стилизовать внутренний дашборд и графики отчета] so that [они соответствовали нашей дизайн-системе Linear-like].

First, read these files completely before responding:
* #design-blueprint.md
* [код страницы дашборда и отчета, который мы сделали на Шаге 7]

Here is a reference to what I want to achieve:
Адаптация стандартных графиков Tremor под нашу монохромную цинковую палитру. Карточки рекомендаций выглядят как строгий список задач (в стиле Linear).
Here's what makes this reference work:
* Always убирай у графиков Tremor яркие дефолтные цвета. Переопредели их на оттенки белого, серого и приглушенного синего.
* Always делай сайдбар (если он есть) максимально незаметным (`border-r border-white/10`, без заливки).
* Never не делай шрифты в таблицах и карточках слишком большими. Используй `text-sm` для данных.

SUCCESS BRIEF
* Type of output: Обновленные CSS/Tailwind классы для компонентов Tremor и структуры дашборда.
* Success means: Внутрянка продукта выглядит так же дорого, как и лендинг.

DO NOT start executing yet. Ask clarifying questions.
Give me your execution plan. Only begin work once we've aligned.