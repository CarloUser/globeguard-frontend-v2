import {createPendingLegalPage} from '@/components/legal/pending-legal-page';

const {generateMetadata, PendingLegalPage} = createPendingLegalPage({key: 'widerruf', href: '/widerruf'});

export {generateMetadata};
export default PendingLegalPage;
