import {createPendingLegalPage} from '@/components/legal/pending-legal-page';

const {generateMetadata, PendingLegalPage} = createPendingLegalPage({key: 'datenschutz', href: '/datenschutz'});

export {generateMetadata};
export default PendingLegalPage;
