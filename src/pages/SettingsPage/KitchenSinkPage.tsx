import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Check,
  FileText,
  Inbox,
  Pencil,
  Plus,
  Search,
  Settings as SettingsIcon,
  Trash2,
} from 'lucide-react';
import type { Priority } from '@/types/domain';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PriorityBadge,
  ScrollArea,
  SegmentedControl,
  Skeleton,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  useToast,
} from '@/shared/ui';
import styles from './KitchenSinkPage.module.css';

// Витрина примитивов `shared/ui` этапа 2 — оставлена для отладки, доступна
// по `/#/settings/kitchen-sink` (см. `router.tsx`), реальная страница
// настроек — `SettingsPage.tsx`.

const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3'];

const SCROLL_DEMO_ITEMS = Array.from({ length: 20 }, (_, i) => ({
  id: `scroll-item-${i + 1}`,
  label: `Пункт списка ${i + 1}`,
}));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.rowContent}>{children}</div>
    </div>
  );
}

function ButtonsDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <>
      <Row label="Варианты">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </Row>
      <Row label="Размеры">
        <Button size="md">Средняя</Button>
        <Button size="sm">Маленькая</Button>
      </Row>
      <Row label="Иконки">
        <Button iconLeft={<Plus size={16} strokeWidth={2} />}>Добавить</Button>
        <Button variant="secondary" iconRight={<Check size={16} strokeWidth={2} />}>
          Готово
        </Button>
      </Row>
      <Row label="Состояния">
        <Button disabled>Disabled</Button>
        <Button loading={loading} onClick={() => setLoading((v) => !v)}>
          {loading ? 'Идёт загрузка…' : 'Нажми, чтобы загрузить'}
        </Button>
      </Row>
    </>
  );
}

function IconButtonsDemo() {
  return (
    <Row label="Варианты и размеры">
      <IconButton aria-label="Поиск" variant="ghost" size="md">
        <Search size={18} strokeWidth={2} />
      </IconButton>
      <IconButton aria-label="Редактировать" variant="secondary" size="md">
        <Pencil size={16} strokeWidth={2} />
      </IconButton>
      <IconButton aria-label="Подтвердить" variant="primary" size="sm">
        <Check size={14} strokeWidth={2} />
      </IconButton>
      <IconButton aria-label="Удалить" variant="danger" size="sm">
        <Trash2 size={14} strokeWidth={2} />
      </IconButton>
    </Row>
  );
}

function BadgesDemo() {
  return (
    <>
      <Row label="Статусные варианты">
        <Badge variant="neutral">Черновик</Badge>
        <Badge variant="info">Инфо</Badge>
        <Badge variant="success">Готово</Badge>
        <Badge variant="warning">Внимание</Badge>
        <Badge variant="danger">Ошибка</Badge>
        <Badge variant="accent">Новое</Badge>
      </Row>
      <Row label="Размеры">
        <Badge variant="info" size="md">
          Средний
        </Badge>
        <Badge variant="info" size="sm">
          Маленький
        </Badge>
      </Row>
      <Row label="Приоритеты (цвет + метка + плотность заливки)">
        {PRIORITIES.map((p) => (
          <PriorityBadge key={p} priority={p} />
        ))}
      </Row>
      <Row label="Приоритет без видимой метки (только aria-label)">
        <PriorityBadge priority="P0" showLabel={false} title="Критический приоритет" />
        <PriorityBadge priority="P3" showLabel={false} title="Низкий приоритет" />
      </Row>
    </>
  );
}

function CardsDemo() {
  return (
    <Row label="Варианты">
      <Card className={styles.demoCard}>
        <strong>Default</strong>
        <p>Обычная поверхность.</p>
      </Card>
      <Card variant="raised" className={styles.demoCard}>
        <strong>Raised</strong>
        <p>Приподнятая поверхность.</p>
      </Card>
      <Card
        variant="interactive"
        className={styles.demoCard}
        onClick={() => window.alert('Карточка кликнута')}
      >
        <strong>Interactive</strong>
        <p>Кликабельная, с hover/active.</p>
      </Card>
    </Row>
  );
}

function SkeletonsDemo() {
  return (
    <>
      <Row label="Формы">
        <Skeleton width={120} height={16} radius="sm" />
        <Skeleton width={64} height={64} radius="full" />
        <Skeleton width={200} height={80} radius="lg" />
      </Row>
      <Row label="Несколько строк (count)">
        <div className={styles.skeletonLines}>
          <Skeleton width="80%" height={12} count={3} />
        </div>
      </Row>
    </>
  );
}

function SpinnersDemo() {
  return (
    <Row label="Размеры">
      <Spinner size="sm" />
      <Spinner size="md" />
    </Row>
  );
}

function TabsDemo() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview" icon={<Inbox size={14} strokeWidth={2} />}>
          Обзор
        </TabsTrigger>
        <TabsTrigger value="documents" icon={<FileText size={14} strokeWidth={2} />}>
          Документы
        </TabsTrigger>
        <TabsTrigger value="settings" icon={<SettingsIcon size={14} strokeWidth={2} />}>
          Настройки
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className={styles.tabPanel}>
        Содержимое вкладки «Обзор».
      </TabsContent>
      <TabsContent value="documents" className={styles.tabPanel}>
        Содержимое вкладки «Документы».
      </TabsContent>
      <TabsContent value="settings" className={styles.tabPanel}>
        Содержимое вкладки «Настройки».
      </TabsContent>
    </Tabs>
  );
}

function SegmentedControlDemo() {
  const [value, setValue] = useState('queue');
  return (
    <Row label="Очередь · Сроки">
      <SegmentedControl
        aria-label="Режим правой колонки"
        value={value}
        onValueChange={setValue}
        options={[
          { value: 'queue', label: 'Очередь', count: 7 },
          { value: 'deadlines', label: 'Сроки', count: 3 },
        ]}
      />
    </Row>
  );
}

function TooltipDemo() {
  return (
    <Row label="Наведи курсор">
      <Tooltip content="Подсказка появляется с задержкой ~400ms">
        <Button variant="secondary">Наведи на меня</Button>
      </Tooltip>
      <Tooltip content="Иконка-кнопка тоже может иметь тултип" side="right">
        <IconButton aria-label="Информация" variant="ghost">
          <Bell size={16} strokeWidth={2} />
        </IconButton>
      </Tooltip>
    </Row>
  );
}

function DialogDemo() {
  return (
    <Row label="Модальное окно">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Открыть диалог</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить предложение агента?</DialogTitle>
            <DialogDescription>
              Действие необратимо: карточка будет отмечена как отклонённая, агент учтёт решение.
            </DialogDescription>
          </DialogHeader>
          <p className={styles.dialogBody}>
            Это пример деструктивного сценария — таким диалогам SPEC отводит роль подтверждения,
            когда undo-тоста недостаточно.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Отмена</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="danger">Отклонить</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Row>
  );
}

function PopoverDemo() {
  return (
    <Row label="Всплывающая панель">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary">Открыть popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className={styles.popoverText}>Короткая контекстная панель без модальности.</p>
        </PopoverContent>
      </Popover>
    </Row>
  );
}

function EmptyStateDemo() {
  return (
    <Row label="Пустая очередь">
      <div className={styles.emptyStateWrap}>
        <EmptyState
          icon={Inbox}
          title="Очередь пуста"
          description="Пока нет карточек, ожидающих решения. Агент пришлёт новые предложения по мере работы."
          action={
            <Button variant="secondary" size="sm">
              Обновить
            </Button>
          }
        />
      </div>
    </Row>
  );
}

function ToastDemoButtons() {
  const { toast } = useToast();

  return (
    <Row label="Варианты уведомлений">
      <Button
        variant="secondary"
        onClick={() =>
          toast({ title: 'Сохранено', description: 'Изменения применены.', variant: 'default' })
        }
      >
        Default
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ title: 'Карточка подтверждена', variant: 'success' })}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({ title: 'Проверьте срок', description: 'Дедлайн через 2 дня.', variant: 'warning' })
        }
      >
        Warning
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ title: 'Не удалось отправить', variant: 'danger' })}
      >
        Danger
      </Button>
      <Button
        variant="primary"
        onClick={() =>
          toast({
            title: 'Карточка отклонена',
            description: 'Решение можно отменить.',
            variant: 'default',
            duration: 6000,
            action: { label: 'Отменить', onClick: () => toast({ title: 'Решение отменено', variant: 'success' }) },
          })
        }
      >
        С undo
      </Button>
    </Row>
  );
}

function ScrollAreaDemo() {
  return (
    <Row label="Список с тенями прокрутки">
      <div className={styles.scrollAreaDemo}>
        <ScrollArea>
          <ul className={styles.scrollList}>
            {SCROLL_DEMO_ITEMS.map((item) => (
              <li key={item.id} className={styles.scrollItem}>
                {item.label}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
    </Row>
  );
}

function ShowcaseContent() {
  return (
    <div className={styles.showcase}>
      <Section title="Button">
        <ButtonsDemo />
      </Section>
      <Section title="IconButton">
        <IconButtonsDemo />
      </Section>
      <Section title="Badge / PriorityBadge">
        <BadgesDemo />
      </Section>
      <Section title="Card">
        <CardsDemo />
      </Section>
      <Section title="Skeleton">
        <SkeletonsDemo />
      </Section>
      <Section title="Spinner">
        <SpinnersDemo />
      </Section>
      <Section title="Tabs">
        <TabsDemo />
      </Section>
      <Section title="SegmentedControl">
        <SegmentedControlDemo />
      </Section>
      <Section title="Tooltip">
        <TooltipDemo />
      </Section>
      <Section title="Dialog">
        <DialogDemo />
      </Section>
      <Section title="Popover">
        <PopoverDemo />
      </Section>
      <Section title="EmptyState">
        <EmptyStateDemo />
      </Section>
      <Section title="Toast (undo)">
        <ToastDemoButtons />
      </Section>
      <Section title="ScrollArea">
        <ScrollAreaDemo />
      </Section>
    </div>
  );
}

/** Витрина примитивов дизайн-системы — отладочный экран, вне основного пользовательского пути. */
export function KitchenSinkPage() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to="/settings" className={styles.back}>
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          Назад в настройки
        </Link>
        <h1 className={styles.title}>Витрина примитивов</h1>
        <p className={styles.hint}>
          Отладочный экран: визуальная и ручная проверка `shared/ui` вне основного пользовательского пути.
        </p>
      </header>
      <ScrollArea>
        <ShowcaseContent />
      </ScrollArea>
    </div>
  );
}
